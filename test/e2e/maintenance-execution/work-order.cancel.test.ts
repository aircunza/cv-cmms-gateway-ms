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
            permissions: ['mnt.work.orders.view', 'mnt.work.orders.cancel'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['token'] = 'mock-token';
    return true;
  }),
};

describe('Work Order Cancel (e2e, HTTP)', () => {
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

  it('cancels a work order and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workOrder: {
        workOrderCode: '1001',
        workOrderDescription: 'Preventive maintenance on hydraulic pump',
        assetCode: 'AST-001',
        woStatusCode: 'CANCELED',
        woStatusLabel: 'Canceled',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        organizationCode: 'E2E_ORG_001',
        canceledDate: '2026-08-07T16:00:00.000Z',
        canceledReason: 'No replacement parts available',
        operations: [],
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/work-orders/1001/cancel')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({ canceledReason: 'No replacement parts available' })
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.order.cancel',
      expect.objectContaining({
        workOrderCode: '1001',
        organizationCode: 'E2E_ORG_001',
        userRoles: ['PLANNER_MAINTENANCE_01'],
        userPermissions: ['mnt.work.orders.view', 'mnt.work.orders.cancel'],
        canceledReason: 'No replacement parts available',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
      }),
    );

    expect(response.body.workOrder).toBeDefined();
    expect(response.body.workOrder.woStatusCode).toBe('CANCELED');
    expect(response.body.workOrder.canceledReason).toBe(
      'No replacement parts available',
    );
  });

  it('rejects when canceledReason is missing', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/cancel')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({})
      .expect(400);
  });

  it('rejects when canceledReason exceeds 240 characters', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/cancel')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({ canceledReason: 'a'.repeat(241) })
      .expect(400);
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/cancel')
      .set('Cookie', 'token=mock-token')
      .send({ canceledReason: 'No replacement parts available' })
      .expect(400);
  });

  it('rejects when user does not have access to organization', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/cancel')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .send({ canceledReason: 'No replacement parts available' })
      .expect(400);
  });
});
