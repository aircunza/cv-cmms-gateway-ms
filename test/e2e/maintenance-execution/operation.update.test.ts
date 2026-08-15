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
            permissions: ['mnt.work.orders.update'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Operation Update (e2e, HTTP)', () => {
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

  it('updates an operation and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      operation: {
        operationCode: '5001',
        operationName: 'Updated operation name',
        operationStatus: 'UNRELEASED',
        operationType: 'Internal',
        actualHours: 2,
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        operationName: 'Updated operation name',
        operationDescription: 'Updated description',
      })
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'wo.operation.update',
      expect.objectContaining({
        operationCode: 5001,
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        operationName: 'Updated operation name',
        operationDescription: 'Updated description',
      }),
    );

    expect(response.body.operation).toBeDefined();
    expect(response.body.operation.operationCode).toBe('5001');
    expect(response.body.operation.operationName).toBe(
      'Updated operation name',
    );
  });

  it('forwards operationStatus when provided', async () => {
    mockNatsClient.send.mockReturnValue(
      of({
        operation: {
          operationCode: '5001',
          operationStatus: 'IN_PROCESS',
        },
      }),
    );

    await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001')
      .set('Cookie', 'auth_token=mock-token')
      .send({ operationStatus: 'IN_PROCESS' })
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'wo.operation.update',
      expect.objectContaining({
        operationCode: 5001,
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        operationStatus: 'IN_PROCESS',
      }),
    );
  });

  it('rejects when operationStatus exceeds 30 characters', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001')
      .set('Cookie', 'auth_token=mock-token')
      .send({ operationStatus: 'A'.repeat(31) })
      .expect(400);
  });

  it('rejects when a forbidden field is sent', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001')
      .set('Cookie', 'auth_token=mock-token')
      .send({ actualHours: 5 })
      .expect(400);
  });
});