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
            permissions: ['mnt.work.request.update'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['token'] = 'mock-token';
    return true;
  }),
};

describe('Work Request Update (e2e, HTTP)', () => {
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

  it('updates a work request and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      workRequest: {
        requestId: '900000001',
        assetCode: 'AST-001',
        assetShortDescription: 'Hydraulic Pump',
        issueDescription: 'Oil leak detected on the hydraulic pump - updated.',
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
        updatedBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedByName: 'EU',
        createdAt: '2026-08-07T15:12:00.000Z',
        updatedAt: '2026-08-07T15:16:00.000Z',
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
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/work-requests/900000001')
      .set('Authorization', 'Bearer mock-token')
      .set('X-Organization-Code', 'E2E_ORG_001')
      .send({
        issueDescription: 'Oil leak detected on the hydraulic pump - updated.',
      })
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.request.update',
      expect.objectContaining({
        requestId: '900000001',
        issueDescription: 'Oil leak detected on the hydraulic pump - updated.',
        userPermissions: ['mnt.work.request.update'],
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
      }),
    );

    expect(response.body.workRequest).toBeDefined();
    expect(response.body.workRequest.requestId).toBe('900000001');
    expect(response.body.workRequest.issueDescription).toBe(
      'Oil leak detected on the hydraulic pump - updated.',
    );
  });

  it('rejects when user does not have access to organization', async () => {
    await request(app.getHttpServer())
      .patch('/work-requests/900000001')
      .set('Authorization', 'Bearer mock-token')
      .set('X-Organization-Code', 'E2E_ORG_999')
      .send({
        issueDescription: 'Oil leak detected on the hydraulic pump - updated.',
      })
      .expect(400);
  });
});
