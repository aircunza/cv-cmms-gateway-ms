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
            permissions: ['mnt.work.orders.create'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['token'] = 'mock-token';
    return true;
  }),
};

describe('Work Order Create (e2e, HTTP)', () => {
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

  it('creates work order and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workOrder: {
        workOrderCode: '1001',
        workOrderDescription: 'E2E Work Order',
        assetCode: 'AST-001',
        woStatusCode: 'UNRELEASED',
        woStatusLabel: 'Unreleased',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
        organizationCode: 'E2E_ORG_001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        createdByName: 'EU',
        actualHours: 2,
        totalManHours: 2,
        totalSupplierHours: 0,
        operations: [
          {
            operationCode: '5001',
            operationName: 'Lubrication',
            operationSubType: 'Preventive',
            operationStatus: 'UNRELEASED',
            operationStatusLabel: 'Unreleased',
            actualHours: 2,
            workOrderOperationResource: [
              {
                id: '10001',
                resourceCode: 'RES-001',
                resourceSequenceNumber: 1,
                plannedHours: 2,
                actualHours: 2,
                principalFlag: 'Y',
              },
            ],
            workOrderOperationMaterial: [],
          },
        ],
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', 'Bearer mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        workOrderDescription: 'E2E Work Order',
        woStatusCode: 'UNRELEASED',
        assetCode: 'AST-001',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
        operations: [
          {
            operationName: 'Lubrication',
            operationDescription: 'Lubrication test',
            operationSeqNumber: 10,
            createdBy: '550e8400-e29b-41d4-a716-446655440001',
            operationStatus: 'UNRELEASED',
            operationType: 'Internal',
            operationSubType: 'Preventive',
            actualStartDate: '2025-11-21T08:00:00.000Z',
            actualCompletionDate: '2025-11-21T10:00:00.000Z',
            workOrderOperationResource: [
              {
                principalFlag: 'Y',
                resourceCode: 'RES-001',
                resourceSequenceNumber: 1,
                plannedHours: 2,
                actualHours: 2,
              },
            ],
          },
        ],
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.order.create',
      expect.objectContaining({
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        organizationCode: 'E2E_ORG_001',
        userPermissions: ['mnt.work.orders.create'],
        userRoles: ['PLANNER_MAINTENANCE_01'],
        workOrderDescription: 'E2E Work Order',
        woStatusCode: 'UNRELEASED',
        assetCode: 'AST-001',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
      }),
    );

    expect(response.body.workOrder).toBeDefined();
    expect(response.body.workOrder.workOrderCode).toBe('1001');
    expect(response.body.workOrder.organizationCode).toBe('E2E_ORG_001');
  });

  it('rejects when X-Organization-Code header is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', 'Bearer mock-token')
      .send({
        workOrderDescription: 'E2E Work Order',
        woStatusCode: 'UNRELEASED',
        assetCode: 'AST-001',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'X-Organization-Code header is required',
    );
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
      req['token'] = 'mock-token';
      return true;
    });

    const response = await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', 'Bearer mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .send({
        workOrderDescription: 'E2E Work Order',
        woStatusCode: 'UNRELEASED',
        assetCode: 'AST-001',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'User does not have access to organization',
    );
  });

  it('filters deniedPermissions when forwarding payload to microservice', async () => {
    const microserviceResponse = {
      workOrder: {
        workOrderCode: '1001',
        workOrderDescription: 'E2E Work Order',
        assetCode: 'AST-001',
        woStatusCode: 'UNRELEASED',
        woStatusLabel: 'Unreleased',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
        organizationCode: 'E2E_ORG_001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        createdByName: 'EU',
        actualHours: 2,
        totalManHours: 2,
        totalSupplierHours: 0,
        operations: [],
      },
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
              roleCode: 'PLANNER_MAINTENANCE_01',
              roleName: 'Planner',
              roleDescription: 'Planner role',
              permissions: [
                'mnt.work.orders.create',
                'oracle.mnt.work.orders.create',
              ],
              deniedPermissions: ['oracle.mnt.work.orders.create'],
            },
            {
              roleCode: 'TECHNICIAN_MAINTENANCE_01',
              roleName: 'Technician',
              roleDescription: 'Technician role',
              permissions: ['mnt.work.orders.read'],
              deniedPermissions: null,
            },
          ],
        },
      ];
      req['token'] = 'mock-token';
      return true;
    });

    await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', 'Bearer mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        workOrderDescription: 'E2E Work Order',
        woStatusCode: 'UNRELEASED',
        assetCode: 'AST-001',
        workOrderType: 'Planned',
        workOrderSubType: 'Preventive',
        workOrderPriority: '2',
        enableOracleWorkOrder: 'N',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.order.create',
      expect.objectContaining({
        userPermissions: ['mnt.work.orders.create', 'mnt.work.orders.read'],
        userRoles: ['PLANNER_MAINTENANCE_01', 'TECHNICIAN_MAINTENANCE_01'],
      }),
    );
  });
});
