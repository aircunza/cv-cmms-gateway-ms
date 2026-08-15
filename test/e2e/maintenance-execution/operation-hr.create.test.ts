import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
            roleDescription: 'Planner role',
            permissions: ['mnt.work.orders.create'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Operation HR Usage Create (e2e, HTTP)', () => {
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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

  it('creates an HR usage and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      hrUsage: {
        id: '10001',
        operationCode: '5001',
        organizationCode: 'E2E_ORG_001',
        resourceCode: 'RES-001',
        actualHours: 3,
        hourlyCost: 25.5,
        principalFlag: 'N',
        resourceSequenceNumber: 2,
        status: 'ACTIVE',
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-orders/1001/operations/5001/human-resources')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        operationCode: 5001,
        organizationCode: 'E2E_ORG_001',
        resourceCode: 'RES-001',
        actualHours: 3,
        hourlyCost: 25.5,
        principalFlag: 'N',
        resourceSequenceNumber: 2,
        actualStartDate: '2026-08-07T09:00:00.000Z',
        actualCompletionDate: '2026-08-07T12:00:00.000Z',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'operation.hr.create',
      expect.objectContaining({
        operationCode: 5001,
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        organizationCode: 'E2E_ORG_001',
        resourceCode: 'RES-001',
        actualHours: 3,
        resourceSequenceNumber: 2,
        principalFlag: 'N',
      }),
    );

    expect(response.body.hrUsage).toBeDefined();
    expect(response.body.hrUsage.id).toBe('10001');
    expect(response.body.hrUsage.resourceCode).toBe('RES-001');
  });

  it('rejects when resourceCode is missing', async () => {
    await request(app.getHttpServer())
      .post('/work-orders/1001/operations/5001/human-resources')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        organizationCode: 'E2E_ORG_001',
        actualHours: 3,
        resourceSequenceNumber: 2,
        actualStartDate: '2026-08-07T09:00:00.000Z',
        actualCompletionDate: '2026-08-07T12:00:00.000Z',
      })
      .expect(400);
  });

  it('rejects when actualHours <= 0', async () => {
    await request(app.getHttpServer())
      .post('/work-orders/1001/operations/5001/human-resources')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        organizationCode: 'E2E_ORG_001',
        resourceCode: 'RES-001',
        actualHours: 0,
        resourceSequenceNumber: 2,
        actualStartDate: '2026-08-07T09:00:00.000Z',
        actualCompletionDate: '2026-08-07T12:00:00.000Z',
      })
      .expect(400);
  });

  it('rejects when a date is not a valid ISO 8601 string', async () => {
    await request(app.getHttpServer())
      .post('/work-orders/1001/operations/5001/human-resources')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        organizationCode: 'E2E_ORG_001',
        resourceCode: 'RES-001',
        actualHours: 3,
        resourceSequenceNumber: 2,
        actualStartDate: 'not-a-date',
        actualCompletionDate: '2026-08-07T12:00:00.000Z',
      })
      .expect(400);
  });
});