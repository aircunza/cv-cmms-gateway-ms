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
            permissions: ['mnt.assets.update'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Assets Update (e2e, HTTP)', () => {
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

  it('updates an asset successfully', async () => {
    const microserviceResponse = {
      asset: {
        assetCode: 'AST-001',
        assetDescription: 'Updated Asset',
        organizationCode: 'E2E_ORG_001',
        updatedBy: 'E2E_USER_01',
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/assets/AST-001')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        assetDescription: 'Updated Asset',
      })
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'asset.update',
      expect.objectContaining({
        assetCode: 'AST-001',
        assetDescription: 'Updated Asset',
        actorCode: 'E2E_USER_01',
      }),
    );

    expect(response.body.asset).toBeDefined();
    expect(response.body.asset.assetDescription).toBe('Updated Asset');
  });

  it('deactivates an asset successfully', async () => {
    const microserviceResponse = {
      asset: {
        assetCode: 'AST-001',
        isActive: 'N',
      },
      message: 'Asset deactivated successfully',
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .patch('/assets/AST-001/deactivate')
      .set('Cookie', 'auth_token=mock-token')
      .expect(200);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'asset.deactivate',
      expect.objectContaining({
        assetCode: 'AST-001',
        actorCode: 'E2E_USER_01',
      }),
    );

    expect(response.body.asset.isActive).toBe('N');
  });

  it('returns 404 when updating non-existent asset', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        status: 404,
        message: 'Asset not found',
      })),
    );

    const response = await request(app.getHttpServer())
      .patch('/assets/NON-EXISTENT')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        assetDescription: 'Updated',
      })
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('propagates validation error from microservice', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        status: 400,
        message: 'No fields to update',
      })),
    );

    const response = await request(app.getHttpServer())
      .patch('/assets/AST-001')
      .set('Cookie', 'auth_token=mock-token')
      .send({})
      .expect(400);

    expect(response.body.message).toContain('No fields to update');
  });
});
