/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { NATS_SERVICE } from 'src/config';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RpcCustomExceptionFilter } from 'src/common/exceptions/rpc-custom-exception.filter';

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
            roleCode: 'MAINTENANCE_MANAGER',
            roleName: 'Maintenance Manager',
            roleDescription: 'Maintenance manager role',
            permissions: ['mnt.work.centers.create'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Work Centers Create (e2e, HTTP)', () => {
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
    app.useGlobalFilters(new RpcCustomExceptionFilter());
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

  it('creates work center and forwards payload to microservice', async () => {
    const microserviceResponse = {
      workCenter: {
        id: '10000000-0000-4000-8000-000000000001',
        workCenterCode: 'WC-001',
        workCenterDescription: 'Test Work Center',
        workAreaId: '10000000-0000-4000-8000-000000000002',
        centerCostCode: 1001,
        isActive: 'Y',
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-centers')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workCenterCode: 'WC-001',
        workCenterDescription: 'Test Work Center',
        workAreaId: '10000000-0000-4000-8000-000000000002',
        centerCostCode: 1001,
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.center.create',
      expect.objectContaining({
        workCenterCode: 'WC-001',
        workCenterDescription: 'Test Work Center',
        workAreaId: '10000000-0000-4000-8000-000000000002',
        centerCostCode: 1001,
      }),
    );

    expect(response.body.workCenter).toBeDefined();
    expect(response.body.workCenter.workCenterCode).toBe('WC-001');
  });

  it('rejects when required field is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-centers')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workCenterDescription: 'Test Work Center',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('rejects when workCenterCode exceeds max length', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-centers')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workCenterCode: 'W'.repeat(256),
        workAreaId: '10000000-0000-4000-8000-000000000002',
        centerCostCode: 1001,
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('rejects when centerCostCode is not a number', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-centers')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workCenterCode: 'WC-001',
        workAreaId: '10000000-0000-4000-8000-000000000002',
        centerCostCode: 'not-a-number',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('propagates error from microservice', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        status: 400,
        message: 'Center cost code already exists for this work area',
      })),
    );

    const response = await request(app.getHttpServer())
      .post('/work-centers')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workCenterCode: 'WC-001',
        workAreaId: '10000000-0000-4000-8000-000000000002',
        centerCostCode: 1001,
      })
      .expect(400);

    expect(response.body.message).toContain('already exists');
  });
});
