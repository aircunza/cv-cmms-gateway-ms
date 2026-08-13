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

describe('Work Order Find All (e2e, HTTP)', () => {
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

  it('finds all work orders and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workOrders: [
        {
          workOrderCode: '1001',
          workOrderDescription: 'Preventive maintenance',
          assetCode: 'AST-001',
          woStatusCode: 'UNRELEASED',
          woStatusLabel: 'Unreleased',
          workOrderType: 'Planned',
          workOrderSubType: 'Preventive',
          workOrderPriority: '2',
          organizationCode: 'E2E_ORG_001',
          operations: [],
        },
      ],
      total: 1,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const filters = JSON.stringify([
      { field: 'organizationCode', operator: 'eq', value: 'E2E_ORG_001' },
      { field: 'workOrderSubType', operator: 'eq', value: 'Preventive' },
    ]);
    const order = JSON.stringify([['createdAt', 'DESC']]);

    const response = await request(app.getHttpServer())
      .get(
        `/work-orders?filters=${encodeURIComponent(filters)}&order=${encodeURIComponent(order)}&limit=10&offset=0`,
      )
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.order.find.all',
      expect.objectContaining({
        organizationCode: 'E2E_ORG_001',
        userRoles: ['PLANNER_MAINTENANCE_01'],
        userPermissions: ['mnt.work.orders.view'],
        filters: [
          { field: 'organizationCode', operator: 'eq', value: 'E2E_ORG_001' },
          { field: 'workOrderSubType', operator: 'eq', value: 'Preventive' },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
      }),
    );

    expect(response.body.workOrders).toBeDefined();
    expect(response.body.workOrders).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it('rejects when filters is not valid JSON', async () => {
    await request(app.getHttpServer())
      .get(`/work-orders?filters=${encodeURIComponent('{invalid json')}`)
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(400);
  });

  it('rejects when limit is not a non-negative integer', async () => {
    await request(app.getHttpServer())
      .get(
        `/work-orders?filters=${encodeURIComponent('[]')}&limit=${encodeURIComponent('abc')}`,
      )
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(400);
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    await request(app.getHttpServer())
      .get('/work-orders')
      .set('Cookie', 'auth_token=mock-token')
      .expect(400);
  });

  it('rejects when user does not have access to organization', async () => {
    mockAuthGuard.canActivate.mockImplementationOnce((context) => {
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
    });

    await request(app.getHttpServer())
      .get('/work-orders')
      .set('Cookie', 'auth_token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .expect(400);
  });
});
