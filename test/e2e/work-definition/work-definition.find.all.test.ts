import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { of } from 'rxjs';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { NATS_SERVICE } from 'src/config';
import { AuthGuard } from 'src/auth/guards/auth.guard';

const mockNatsClient = {
  send: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn((context) => {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    req['user'] = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      code: 'E2E_USER_01',
      userName: 'E2E User',
      userShortName: 'EU',
      email: 'e2e@test.com',
    };
    req['organizations'] = [
      {
        organizationId: 'org-001',
        organizationCode: 'E2E_ORG_001',
        organizationName: 'E2E Organization',
        countryCode: 'CO',
        countryName: 'Colombia',
        timezone: 'America/Bogota',
        roles: [
          {
            roleCode: 'PLANNER_MAINTENANCE_01',
            roleName: 'Planner',
            roleDescription: 'Maintenance planner role',
            permissions: [],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Work Definition Find All (e2e, HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NATS_SERVICE)
      .useValue(mockNatsClient)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds all work definitions and forwards enriched payload', async () => {
    const microserviceResponse = {
      workDefinitions: [
        {
          workDefinitionId: '1',
          workDefinitionCode: 'WD-001',
          workDefinitionDescription: 'Hydraulic pump maintenance',
          isActive: 'Y',
          createdAt: '2026-08-07T15:12:00.000Z',
          updatedAt: null,
        },
      ],
      total: 1,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const filters = JSON.stringify([
      { field: 'isActive', operator: 'eq', value: 'Y' },
    ]);
    const order = JSON.stringify([['createdAt', 'DESC']]);

    const response = await request(app.getHttpServer())
      .get(
        `/work-definitions?filters=${encodeURIComponent(filters)}&order=${encodeURIComponent(order)}&limit=10&offset=0`,
      )
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.definition.find.all',
      expect.objectContaining({
        userRoles: [],
        filters: [{ field: 'isActive', operator: 'eq', value: 'Y' }],
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
      }),
    );

    expect(response.body.workDefinitions).toBeDefined();
    expect(response.body.workDefinitions).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it('finds all work definitions without X-Organization-Code header', async () => {
    const microserviceResponse = {
      workDefinitions: [],
      total: 0,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    await request(app.getHttpServer())
      .get('/work-definitions')
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.definition.find.all',
      expect.objectContaining({
        userRoles: [],
      }),
    );
  });

  it('forwards organizationCode when X-Organization-Code header is provided', async () => {
    const microserviceResponse = {
      workDefinitions: [],
      total: 0,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    await request(app.getHttpServer())
      .get('/work-definitions')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.definition.find.all',
      expect.objectContaining({
        organizationCode: 'E2E_ORG_001',
        userRoles: ['PLANNER_MAINTENANCE_01'],
      }),
    );
  });
});
