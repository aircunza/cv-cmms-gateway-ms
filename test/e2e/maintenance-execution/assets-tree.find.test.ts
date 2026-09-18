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
            permissions: ['mnt.assets.tree.read'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Assets Tree Find (e2e, HTTP)', () => {
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

  describe('GET /assets-tree/:id', () => {
    it('finds an assets tree record by id', async () => {
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
        .get('/assets-tree/1')
        .set('Cookie', 'auth_token=mock-token')
        .expect(200);

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        'assets.tree.find.one',
        { id: 1 },
      );

      expect(response.body.assetsTree).toBeDefined();
      expect(response.body.assetsTree.id).toBe('1');
      expect(response.body.assetsTree.assetCode).toBe('AST-001');
    });

    it('propagates 404 error from microservice', async () => {
      mockNatsClient.send.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Assets tree record not found' })),
      );

      const response = await request(app.getHttpServer())
        .get('/assets-tree/999999')
        .set('Cookie', 'auth_token=mock-token')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /assets-tree', () => {
    it('returns all assets tree records', async () => {
      const microserviceResponse = {
        assetsTree: [
          {
            id: '1',
            assetCode: 'AST-001',
            unit: 'Hydraulic System',
            subunit: 'Main Pump',
            maintainableItem: 'Pump Assembly',
            sparePartCode: 'SP-HYD-001',
            sparePartName: 'Hydraulic Seal Kit',
            isActive: 'Y',
          },
          {
            id: '2',
            assetCode: 'AST-001',
            unit: 'Lubrication System',
            subunit: 'Oil Filter',
            maintainableItem: 'Filter Assembly',
            sparePartCode: 'SP-LUB-001',
            sparePartName: 'Oil Filter Element',
            isActive: 'Y',
          },
        ],
        total: 2,
      };

      mockNatsClient.send.mockReturnValue(of(microserviceResponse));

      const response = await request(app.getHttpServer())
        .get('/assets-tree')
        .set('Cookie', 'auth_token=mock-token')
        .expect(200);

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        'assets.tree.find.all',
        expect.any(Object),
      );

      expect(response.body.assetsTree).toBeDefined();
      expect(Array.isArray(response.body.assetsTree)).toBe(true);
      expect(response.body.assetsTree).toHaveLength(2);
    });

    it('filters by assetCode query param', async () => {
      const microserviceResponse = {
        assetsTree: [
          {
            id: '1',
            assetCode: 'AST-001',
            unit: 'Hydraulic System',
            subunit: 'Main Pump',
            maintainableItem: 'Pump Assembly',
            sparePartCode: 'SP-HYD-001',
            sparePartName: 'Hydraulic Seal Kit',
            isActive: 'Y',
          },
        ],
        total: 1,
      };

      mockNatsClient.send.mockReturnValue(of(microserviceResponse));

      const response = await request(app.getHttpServer())
        .get('/assets-tree?assetCode=AST-001')
        .set('Cookie', 'auth_token=mock-token')
        .expect(200);

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        'assets.tree.find.all',
        expect.objectContaining({ assetCode: 'AST-001' }),
      );

      expect(response.body.assetsTree).toHaveLength(1);
      expect(response.body.assetsTree[0].assetCode).toBe('AST-001');
    });
  });
});
