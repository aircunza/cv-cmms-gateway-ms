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
            roleCode: 'MANUFACTURING_FACILITATOR',
            roleName: 'Facilitator',
            roleDescription: 'Manufacturing facilitator role',
            permissions: ['mnt.work.request.create', 'mnt.work.orders.create'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['token'] = 'mock-token';
    return true;
  }),
};

describe('Work Request Find All (e2e, HTTP)', () => {
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

  it('finds all work requests and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workRequests: [
        {
          requestId: '900000001',
          assetCode: 'AST-001',
          assetShortDescription: 'Hydraulic Pump',
          issueDescription: 'Oil leak detected on the hydraulic pump.',
          statusCode: 'RELEASED',
          statusLabel: 'Released',
          requestedAt: '2026-08-07T15:12:00.000Z',
          completedAt: null,
          releasedAt: '2026-08-07T15:12:00.000Z',
          canceledAt: null,
          organizationCode: 'E2E_ORG_001',
          organizationName: 'E2E Organization',
          workOrders: [
            {
              workOrderCode: '1001',
              workOrderDescription: 'Oil leak detected on the hydraulic pump.',
              workOrderType: 'Not Planned',
              workOrderSubType: 'Emergency',
              workOrderPriority: '1',
              woStatusCode: 'RELEASED',
            },
          ],
        },
      ],
      total: 1,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const filters = JSON.stringify([
      { field: 'organizationCode', operator: 'eq', value: 'E2E_ORG_001' },
      { field: 'statusCode', operator: 'eq', value: 'RELEASED' },
    ]);
    const order = JSON.stringify([['createdAt', 'DESC']]);

    const response = await request(app.getHttpServer())
      .get(
        `/work-requests?filters=${encodeURIComponent(filters)}&order=${encodeURIComponent(order)}&limit=10&offset=0`,
      )
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.request.find.all',
      expect.objectContaining({
        organizationCode: 'E2E_ORG_001',
        userRoles: ['MANUFACTURING_FACILITATOR'],
        filters: [
          { field: 'organizationCode', operator: 'eq', value: 'E2E_ORG_001' },
          { field: 'statusCode', operator: 'eq', value: 'RELEASED' },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
      }),
    );

    expect(response.body.workRequests).toBeDefined();
    expect(response.body.workRequests).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    await request(app.getHttpServer())
      .get('/work-requests')
      .set('Cookie', 'token=mock-token')
      .expect(400);
  });

  it('rejects when user does not have access to organization', async () => {
    await request(app.getHttpServer())
      .get('/work-requests')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .expect(400);
  });
});
