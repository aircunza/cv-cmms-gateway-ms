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
            permissions: ['mnt.work.orders.view', 'mnt.work.orders.update'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Work Order Release (e2e, HTTP)', () => {
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

  it('releases a work order and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workOrder: {
        workOrderCode: '1001',
        workOrderDescription: 'Preventive maintenance on hydraulic pump',
        assetCode: 'AST-001',
        woStatusCode: 'RELEASED',
        woStatusLabel: 'Released',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        organizationCode: 'E2E_ORG_001',
        releasedDate: '2026-08-07T15:12:00.000Z',
        operations: [],
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/work-orders/1001/release')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.order.release',
      expect.objectContaining({
        workOrderCode: '1001',
        organizationCode: 'E2E_ORG_001',
        userRoles: ['PLANNER_MAINTENANCE_01'],
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
      }),
    );

    expect(response.body.workOrder).toBeDefined();
    expect(response.body.workOrder.woStatusCode).toBe('RELEASED');
    expect(response.body.workOrder.releasedDate).toBe(
      '2026-08-07T15:12:00.000Z',
    );
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/release')
      .set('Cookie', 'auth_token=mock-token')
      .expect(400);
  });

  it('rejects when user does not have access to organization', async () => {
    await request(app.getHttpServer())
      .patch('/work-orders/1001/release')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .expect(400);
  });
});
