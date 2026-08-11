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

describe('Work Request Create (e2e, HTTP)', () => {
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

  it('creates work request and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workRequest: {
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
        workCenterCode: 'WC-01',
        workCenterDescription: 'Main Workshop',
        centerCostCode: 101,
        workAreaCode: 'WA-01',
        workAreaDescription: 'Plant Floor',
        sector: 'Production',
        subsector: 'Line A',
        organizationCode: 'E2E_ORG_001',
        organizationName: 'E2E Organization',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        createdByName: 'EU',
        updatedBy: null,
        updatedByName: null,
        createdAt: '2026-08-07T15:12:00.000Z',
        updatedAt: '2026-08-07T15:12:00.000Z',
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
      workOrder: {
        workOrderCode: '1001',
        workOrderDescription: 'Oil leak detected on the hydraulic pump.',
        woStatusCode: 'RELEASED',
        woStatusLabel: 'Released',
        workOrderType: 'Not Planned',
        workOrderSubType: 'Emergency',
        workOrderPriority: '1',
        organizationCode: 'E2E_ORG_001',
        enableOracleWorkOrder: 'N',
        operations: [],
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-requests')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        assetCode: 'AST-001',
        assetShortDescription: 'Hydraulic Pump',
        issueDescription: 'Oil leak detected on the hydraulic pump.',
        enableOracleWorkOrder: 'N',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.request.create',
      expect.objectContaining({
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        organizationCode: 'E2E_ORG_001',
        userPermissions: ['mnt.work.request.create', 'mnt.work.orders.create'],
        userRoles: ['MANUFACTURING_FACILITATOR'],
        assetCode: 'AST-001',
        issueDescription: 'Oil leak detected on the hydraulic pump.',
        enableOracleWorkOrder: 'N',
      }),
    );

    expect(response.body.workRequest).toBeDefined();
    expect(response.body.workRequest.requestId).toBe('900000001');
    expect(response.body.workRequest.statusCode).toBe('RELEASED');
    expect(response.body.workOrder).toBeDefined();
    expect(response.body.workOrder.workOrderCode).toBe('1001');
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-requests')
      .set('Cookie', 'token=mock-token')
      .send({
        assetCode: 'AST-001',
        issueDescription: 'Oil leak detected on the hydraulic pump.',
        enableOracleWorkOrder: 'N',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'X-Organization-Code header is required',
    );
  });

  it('rejects when user does not have access to organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-requests')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .send({
        assetCode: 'AST-001',
        issueDescription: 'Oil leak detected on the hydraulic pump.',
        enableOracleWorkOrder: 'N',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'User does not have access to organization',
    );
  });

  it('filters deniedPermissions when forwarding payload to microservice', async () => {
    const microserviceResponse = {
      workRequest: {
        requestId: '900000002',
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
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        createdByName: 'EU',
        updatedBy: null,
        updatedByName: null,
        createdAt: '2026-08-07T15:12:00.000Z',
        updatedAt: '2026-08-07T15:12:00.000Z',
        workOrders: [],
      },
      workOrder: {},
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

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
              roleCode: 'MANUFACTURING_FACILITATOR',
              roleName: 'Facilitator',
              roleDescription: 'Manufacturing facilitator role',
              permissions: [
                'mnt.work.request.create',
                'mnt.work.orders.create',
                'oracle.mnt.work.orders.create',
              ],
              deniedPermissions: ['oracle.mnt.work.orders.create'],
            },
            {
              roleCode: 'TECHNICIAN_MAINTENANCE_01',
              roleName: 'Technician',
              roleDescription: 'Technician role',
              permissions: ['mnt.work.request.read'],
              deniedPermissions: null,
            },
          ],
        },
      ];
      req['token'] = 'mock-token';
      return true;
    });

    await request(app.getHttpServer())
      .post('/work-requests')
      .set('Cookie', 'token=mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        assetCode: 'AST-001',
        issueDescription: 'Oil leak detected on the hydraulic pump.',
        enableOracleWorkOrder: 'N',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.request.create',
      expect.objectContaining({
        userPermissions: [
          'mnt.work.request.create',
          'mnt.work.orders.create',
          'mnt.work.request.read',
        ],
        userRoles: ['MANUFACTURING_FACILITATOR', 'TECHNICIAN_MAINTENANCE_01'],
      }),
    );
  });
});
