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
            permissions: ['mnt.work.centers.read'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Work Centers Find (e2e, HTTP)', () => {
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

  it('finds a work center by id', async () => {
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
      .get('/work-centers/10000000-0000-4000-8000-000000000001')
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith('work.center.find.one', {
      id: '10000000-0000-4000-8000-000000000001',
    });

    expect(response.body.workCenter).toBeDefined();
    expect(response.body.workCenter.workCenterCode).toBe('WC-001');
  });

  it('finds all work centers', async () => {
    const microserviceResponse = {
      workCenters: [
        { id: '1', workCenterCode: 'WC-001' },
        { id: '2', workCenterCode: 'WC-002' },
      ],
      total: 2,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .get('/work-centers')
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.center.find.all',
      {},
    );

    expect(response.body.workCenters).toBeDefined();
    expect(response.body.total).toBe(2);
  });

  it('finds all work centers with filter', async () => {
    const microserviceResponse = {
      workCenters: [{ id: '1', workCenterCode: 'WC-001' }],
      total: 1,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .get('/work-centers?workCenterCode=WC')
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith('work.center.find.all', {
      workCenterCode: 'WC',
    });

    expect(response.body.workCenters).toBeDefined();
  });

  it('finds all work centers filtered by workAreaId', async () => {
    const microserviceResponse = {
      workCenters: [{ id: '1', workCenterCode: 'WC-001' }],
      total: 1,
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .get('/work-centers?workAreaId=10000000-0000-4000-8000-000000000002')
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith('work.center.find.all', {
      workAreaId: '10000000-0000-4000-8000-000000000002',
    });

    expect(response.body.workCenters).toBeDefined();
  });

  it('returns 404 when work center not found', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        status: 404,
        message: 'Work center not found',
      })),
    );

    const response = await request(app.getHttpServer())
      .get('/work-centers/00000000-0000-0000-0000-000000000000')
      .set('Cookie', 'auth_token=mock-token')
      .expect(404);

    expect(response.body.message).toContain('not found');
  });
});
