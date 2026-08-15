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
            permissions: [
              'mnt.work.orders.view',
              'mnt.work.orders.cancel',
            ],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Operation HR Usage Cancel (e2e, HTTP)', () => {
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

  it('cancels an HR usage and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      hrUsage: {
        id: '10001',
        resourceCode: 'RES-002',
        resourceSequenceNumber: 2,
        actualHours: 3,
        status: 'CANCELED',
        canceledReason: 'Not required',
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001/human-resources/10001/cancel')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({ canceledReason: 'Not required' })
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'operation.hr.cancel',
      expect.objectContaining({
        id: 10001,
        operationCode: 5001,
        canceledReason: 'Not required',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
      }),
    );

    expect(response.body.hrUsage).toBeDefined();
    expect(response.body.hrUsage.id).toBe('10001');
    expect(response.body.hrUsage.status).toBe('CANCELED');
  });

  it('rejects when canceledReason is missing', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001/human-resources/10001/cancel')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({})
      .expect(400);
  });

  it('rejects when canceledReason exceeds 240 characters', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/operations/5001/human-resources/10001/cancel')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({ canceledReason: 'a'.repeat(241) })
      .expect(400);
  });
});