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
            permissions: ['mnt.assets.tree.create', 'mnt.assets.tree.read'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Assets Tree Create (e2e, HTTP)', () => {
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

  it('creates assets tree record and forwards enriched payload to microservice', async () => {
    const microserviceResponse = {
      assetsTree: {
        id: '1',
        assetCode: 'AST-001',
        unit: 'Hydraulic System',
        subunit: 'Main Pump',
        maintainableItem: 'Pump Assembly',
        sparePartCode: 'SP-HYD-001',
        sparePartName: 'Hydraulic Seal Kit',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        createdByName: 'EU',
        updatedBy: null,
        updatedByName: null,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: null,
        isActive: 'Y',
      },
    };

    mockNatsClient.send.mockReturnValue(of(microserviceResponse));

    const response = await request(app.getHttpServer())
      .post('/assets-tree')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        assetCode: 'AST-001',
        unit: 'Hydraulic System',
        subunit: 'Main Pump',
        maintainableItem: 'Pump Assembly',
        sparePartCode: 'SP-HYD-001',
        sparePartName: 'Hydraulic Seal Kit',
      })
      .expect(201);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'assets.tree.create',
      expect.objectContaining({
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        actorName: 'EU',
        assetCode: 'AST-001',
        unit: 'Hydraulic System',
        subunit: 'Main Pump',
        maintainableItem: 'Pump Assembly',
        sparePartCode: 'SP-HYD-001',
        sparePartName: 'Hydraulic Seal Kit',
      }),
    );

    expect(response.body.assetsTree).toBeDefined();
    expect(response.body.assetsTree.id).toBe('1');
    expect(response.body.assetsTree.assetCode).toBe('AST-001');
    expect(response.body.assetsTree.unit).toBe('Hydraulic System');
  });

  it('rejects when required field is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/assets-tree')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        assetCode: 'AST-001',
        unit: 'Hydraulic System',
        subunit: 'Main Pump',
        maintainableItem: 'Pump Assembly',
        sparePartCode: 'SP-HYD-001',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('rejects when field exceeds max length', async () => {
    const response = await request(app.getHttpServer())
      .post('/assets-tree')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        assetCode: 'AST-001',
        unit: 'A'.repeat(371),
        subunit: 'Main Pump',
        maintainableItem: 'Pump Assembly',
        sparePartCode: 'SP-HYD-001',
        sparePartName: 'Hydraulic Seal Kit',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('propagates error from microservice', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({ status: 400, message: 'Assets tree combination already exists' })),
    );

    const response = await request(app.getHttpServer())
      .post('/assets-tree')
      .set('Cookie', 'auth_token=mock-token')
      .send({
        assetCode: 'AST-001',
        unit: 'Hydraulic System',
        subunit: 'Main Pump',
        maintainableItem: 'Pump Assembly',
        sparePartCode: 'SP-HYD-001',
        sparePartName: 'Hydraulic Seal Kit',
      })
      .expect(400);

    expect(response.body.message).toContain('already exists');
  });
});
