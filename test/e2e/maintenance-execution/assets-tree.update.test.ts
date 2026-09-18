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
            permissions: ['mnt.assets.tree.update'],
            deniedPermissions: null,
          },
        ],
      },
    ];
    req['auth_token'] = 'mock-token';
    return true;
  }),
};

describe('Assets Tree Update & Deactivate (e2e, HTTP)', () => {
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

  describe('PATCH /assets-tree/:id', () => {
    it('updates an assets tree record successfully', async () => {
      const microserviceResponse = {
        assetsTree: {
          id: '1',
          assetCode: 'AST-001',
          unit: 'Hydraulic System Updated',
          subunit: 'Main Pump',
          maintainableItem: 'Pump Assembly',
          sparePartCode: 'SP-HYD-001',
          sparePartName: 'Hydraulic Seal Kit Updated',
          createdBy: '550e8400-e29b-41d4-a716-446655440001',
          createdByName: 'EU',
          updatedBy: '550e8400-e29b-41d4-a716-446655440001',
          updatedByName: 'EU',
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: '2026-09-01T11:00:00.000Z',
          isActive: 'Y',
        },
      };

      mockNatsClient.send.mockReturnValue(of(microserviceResponse));

      const response = await request(app.getHttpServer())
        .patch('/assets-tree/1')
        .set('Cookie', 'auth_token=mock-token')
        .send({
          unit: 'Hydraulic System Updated',
          sparePartName: 'Hydraulic Seal Kit Updated',
        })
        .expect(200);

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        'assets.tree.update',
        expect.objectContaining({
          id: 1,
          actorId: '550e8400-e29b-41d4-a716-446655440001',
          actorName: 'EU',
          unit: 'Hydraulic System Updated',
          sparePartName: 'Hydraulic Seal Kit Updated',
        }),
      );

      expect(response.body.assetsTree).toBeDefined();
      expect(response.body.assetsTree.unit).toBe('Hydraulic System Updated');
      expect(response.body.assetsTree.sparePartName).toBe('Hydraulic Seal Kit Updated');
    });

    it('rejects update when field exceeds max length', async () => {
      const response = await request(app.getHttpServer())
        .patch('/assets-tree/1')
        .set('Cookie', 'auth_token=mock-token')
        .send({
          unit: 'A'.repeat(371),
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('propagates 404 error from microservice', async () => {
      mockNatsClient.send.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Assets tree record not found' })),
      );

      const response = await request(app.getHttpServer())
        .patch('/assets-tree/999999')
        .set('Cookie', 'auth_token=mock-token')
        .send({
          unit: 'Updated Unit',
        })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('propagates 400 error when combination already exists', async () => {
      mockNatsClient.send.mockReturnValue(
        throwError(() => ({ status: 400, message: 'Assets tree combination already exists' })),
      );

      const response = await request(app.getHttpServer())
        .patch('/assets-tree/1')
        .set('Cookie', 'auth_token=mock-token')
        .send({
          unit: 'Duplicate Unit',
        })
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PATCH /assets-tree/:id/deactivate', () => {
    it('deactivates an assets tree record successfully', async () => {
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
          updatedBy: '550e8400-e29b-41d4-a716-446655440001',
          updatedByName: 'EU',
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: '2026-09-01T11:00:00.000Z',
          isActive: 'N',
        },
      };

      mockNatsClient.send.mockReturnValue(of(microserviceResponse));

      const response = await request(app.getHttpServer())
        .patch('/assets-tree/1/deactivate')
        .set('Cookie', 'auth_token=mock-token')
        .expect(200);

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        'assets.tree.deactivate',
        expect.objectContaining({
          id: 1,
          actorId: '550e8400-e29b-41d4-a716-446655440001',
          actorName: 'EU',
        }),
      );

      expect(response.body.assetsTree).toBeDefined();
      expect(response.body.assetsTree.isActive).toBe('N');
    });

    it('propagates 404 error from microservice', async () => {
      mockNatsClient.send.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Assets tree record not found' })),
      );

      const response = await request(app.getHttpServer())
        .patch('/assets-tree/999999/deactivate')
        .set('Cookie', 'auth_token=mock-token')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });
});
