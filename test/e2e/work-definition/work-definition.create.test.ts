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

describe('Work Definition Create (e2e, HTTP)', () => {
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

  it('creates work definition and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workDefinition: {
        workDefinitionId: '1',
        workDefinitionCode: 'WD-001',
        workDefinitionDescription: 'Hydraulic pump maintenance',
        isActive: 'Y',
        createdAt: '2026-08-07T15:12:00.000Z',
        updatedAt: null,
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-definitions')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        workDefinitionCode: 'WD-001',
        workDefinitionDescription: 'Hydraulic pump maintenance',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.definition.create',
      expect.objectContaining({
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        organizationCode: 'E2E_ORG_001',
        userRoles: ['PLANNER_MAINTENANCE_01'],
        workDefinitionCode: 'WD-001',
        workDefinitionDescription: 'Hydraulic pump maintenance',
      }),
    );

    expect(response.body.workDefinition).toBeDefined();
    expect(response.body.workDefinition.workDefinitionCode).toBe('WD-001');
    expect(response.body.workDefinition.isActive).toBe('Y');
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-definitions')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workDefinitionCode: 'WD-001',
        workDefinitionDescription: 'Hydraulic pump maintenance',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'X-Organization-Code header is required',
    );
  });

  it('rejects when user does not have access to organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-definitions')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .send({
        workDefinitionCode: 'WD-001',
        workDefinitionDescription: 'Hydraulic pump maintenance',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'User does not have access to organization',
    );
  });
});
