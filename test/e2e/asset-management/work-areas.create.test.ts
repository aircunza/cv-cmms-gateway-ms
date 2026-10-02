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
            permissions: ['mnt.work.areas.create'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Work Areas Create (e2e, HTTP)', () => {
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

  it('creates work area and forwards payload to microservice', async () => {
    const microserviceResponse = {
      workArea: {
        id: '10000000-0000-4000-8000-000000000001',
        workAreaCode: 'WA-001',
        workAreaDescription: 'Test Work Area',
        organizationCode: 'E2E_ORG_001',
        isActive: 'Y',
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/work-areas')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workAreaCode: 'WA-001',
        workAreaDescription: 'Test Work Area',
        organizationCode: 'E2E_ORG_001',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'work.area.create',
      expect.objectContaining({
        workAreaCode: 'WA-001',
        workAreaDescription: 'Test Work Area',
        organizationCode: 'E2E_ORG_001',
      }),
    );

    expect(response.body.workArea).toBeDefined();
    expect(response.body.workArea.workAreaCode).toBe('WA-001');
  });

  it('rejects when required field is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-areas')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workAreaDescription: 'Test Work Area',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('rejects when workAreaCode exceeds max length', async () => {
    const response = await request(app.getHttpServer())
      .post('/work-areas')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workAreaCode: 'W'.repeat(256),
        organizationCode: 'E2E_ORG_001',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('propagates error from microservice', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        status: 400,
        message: 'Work area code already exists for this organization',
      })),
    );

    const response = await request(app.getHttpServer())
      .post('/work-areas')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        workAreaCode: 'WA-001',
        organizationCode: 'E2E_ORG_001',
      })
      .expect(400);

    expect(response.body.message).toContain('already exists');
  });
});
