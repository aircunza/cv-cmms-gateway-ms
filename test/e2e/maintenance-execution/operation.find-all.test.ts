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
            roleDescription: 'Planner role',
            permissions: ['mnt.work.orders.view'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Operation Find All (e2e, HTTP)', () => {
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

  it('finds all operations and forwards query to microservice', async () => {
    const microserviceResponse = {
      operations: [
        {
          operationCode: '5001',
          operationName: 'Hydraulic pump repair',
          operationSeqNumber: 10,
          operationStatus: 'UNRELEASED',
          operationType: 'Internal',
          actualHours: 2,
        },
        {
          operationCode: '5002',
          operationName: 'Bearing replacement',
          operationSeqNumber: 20,
          operationStatus: 'RELEASED',
          operationType: 'Internal',
          actualHours: 4,
        },
      ],
      total: 2,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .get('/work-orders/1001/operations')
      .query({ assetCode: 'AST-001', operationStatus: 'UNRELEASED' })
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'wo.operation.find.all',
      expect.objectContaining({
        workOrderCode: 1001,
        assetCode: 'AST-001',
        operationStatus: 'UNRELEASED',
      }),
    );

    expect(response.body.operations).toBeDefined();
    expect(response.body.operations).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });

  it('forwards workOrderCode as number without extra query params', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ operations: [], total: 0 }),
    );

    await request(app.getHttpServer())
      .get('/work-orders/1001/operations')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'wo.operation.find.all',
      expect.objectContaining({
        workOrderCode: 1001,
      }),
    );
  });
});