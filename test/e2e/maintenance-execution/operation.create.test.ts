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

describe('Operation Create (e2e, HTTP)', () => {
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

  it('creates an operation and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      operation: {
        operationCode: '5001',
        operationName: 'Hydraulic pump repair',
        operationSeqNumber: 10,
        operationStatus: 'UNRELEASED',
        operationType: 'Internal',
        actualHours: 2,
        hrUsages: [
          {
            id: '10001',
            resourceCode: 'RES-001',
            resourceSequenceNumber: 1,
            actualHours: 2,
            principalFlag: 'Y',
            status: 'ACTIVE',
          },
        ],
        materialUsages: [],
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-orders/1001/operations')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        operationName: 'Hydraulic pump repair',
        operationDescription: 'Repair the hydraulic pump',
        operationSeqNumber: 10,
        operationStatus: 'UNRELEASED',
        operationType: 'Internal',
        organizationCode: 'E2E_ORG_001',
        resources: [
          {
            resourceCode: 'RES-001',
            resourceSequenceNumber: 1,
            actualHours: 2,
            principalFlag: 'Y',
            actualStartDate: '2026-08-07T08:00:00.000Z',
            actualCompletionDate: '2026-08-07T10:00:00.000Z',
            hourlyCost: 25.5,
          },
        ],
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'wo.operation.create',
      expect.objectContaining({
        workOrderCode: 1001,
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        operationName: 'Hydraulic pump repair',
        operationSeqNumber: 10,
        operationStatus: 'UNRELEASED',
        operationType: 'Internal',
        organizationCode: 'E2E_ORG_001',
        resources: [
          {
            resourceCode: 'RES-001',
            resourceSequenceNumber: 1,
            actualHours: 2,
            principalFlag: 'Y',
            actualStartDate: '2026-08-07T08:00:00.000Z',
            actualCompletionDate: '2026-08-07T10:00:00.000Z',
            hourlyCost: 25.5,
          },
        ],
      }),
    );

    expect(response.body.operation).toBeDefined();
    expect(response.body.operation.operationCode).toBe('5001');
    expect(response.body.operation.operationName).toBe(
      'Hydraulic pump repair',
    );
  });

  it('rejects when resources is empty', async () => {
    await request(app.getHttpServer())
      .post('/work-orders/1001/operations')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        operationName: 'Hydraulic pump repair',
        organizationCode: 'E2E_ORG_001',
        resources: [],
      })
      .expect(400);
  });

  it('rejects when organizationCode is missing', async () => {
    await request(app.getHttpServer())
      .post('/work-orders/1001/operations')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        operationName: 'Hydraulic pump repair',
        resources: [
          {
            resourceCode: 'RES-001',
            resourceSequenceNumber: 1,
            actualHours: 2,
            principalFlag: 'Y',
            actualStartDate: '2026-08-07T08:00:00.000Z',
            actualCompletionDate: '2026-08-07T10:00:00.000Z',
          },
        ],
      })
      .expect(400);
  });

  it('rejects when a resource has actualHours <= 0', async () => {
    await request(app.getHttpServer())
      .post('/work-orders/1001/operations')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        operationName: 'Hydraulic pump repair',
        organizationCode: 'E2E_ORG_001',
        resources: [
          {
            resourceCode: 'RES-001',
            resourceSequenceNumber: 1,
            actualHours: 0,
            principalFlag: 'Y',
            actualStartDate: '2026-08-07T08:00:00.000Z',
            actualCompletionDate: '2026-08-07T10:00:00.000Z',
          },
        ],
      })
      .expect(400);
  });
});