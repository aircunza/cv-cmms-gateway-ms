-- =====================================================================
-- 01_auth_ms.sql
-- Mock data for the AUTH microservice DB (cv-cmms-auth-ms).
--
-- Contents:
--   1) 1 organization in Peru: ORG-LIMA-001 (Empresa 1)
--   2) 11 test users (password blank, see note below)
--   3) Role-based permissions in user_org_permissions
--
-- NOTE (password):
--   The [password] column is left empty (''). Authentication uses bcrypt,
--   so you must generate the hash and update each user to be able to
--   log in. Example:
--     UPDATE [dbo].[users]
--     SET [password] = '<bcrypt_hash_of_the_password>'
--     WHERE [code] = 'USR001';
--
-- Roles covered (all 10 defined in maintenance-execution):
--   ADMIN, MANUFACTURING_FACILITATOR, PLANNER_MAINTENANCE_01/02,
--   COORDINATOR_MAINTENANCE_01/02, SUPERVISOR_MAINTENANCE_01/02,
--   TECHNICIAN_MAINTENANCE_01/02. USR011 has 2 roles (TECH_02 + SUP_01)
--   to test permission aggregation across roles.
--
-- Permissions format: JSON string array, same as serialized by the API
-- (parsePermissions / JSON.stringify from auth-ms).
-- =====================================================================

-- =====================================================================
-- 1. ORGANIZATION
-- =====================================================================
INSERT INTO [dbo].[organizations]
    ([id], [code], [name], [country_code], [country_name], [timezone],
     [offset_minutes], [created_at], [updated_at], [is_active])
VALUES
    ('10000000-0000-4000-8000-000000000001', 'ORG-LIMA-001', 'Empresa 1',
     'PE', 'Peru', 'America/Lima', -300,
     '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', 'Y');


-- =====================================================================
-- 2. USERS
-- Common password: Password123!
-- Pre-generated bcrypt hashes
-- =====================================================================

INSERT INTO [dbo].[users]
(
    [id],
    [code],
    [email],
    [user_name],
    [user_short_name],
    [password],
    [created_at],
    [is_active],
    [is_verified]
)
VALUES

-- User 01: ADMIN
(
    '10000000-0000-4000-8000-000000000011',
    'USR001',
    'usuario01@empresa1.pe',
    'Usuario 01',
    'Usuario 01',
    '$2b$10$MJY4PgsqcMpcsQC7gRCtG.rshrmgQUbzd6wOWi/5DHyaAFRwd4T2K',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 02: MANUFACTURING_FACILITATOR
(
    '10000000-0000-4000-8000-000000000012',
    'USR002',
    'usuario02@empresa1.pe',
    'Usuario 02',
    'Usuario 02',
    '$2b$10$/W1.URR5a9NLl57G.BgrSuj5We7L5Ms7DY5YgUatxPJm4jFqmGb/.',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 03: PLANNER_MAINTENANCE_01
(
    '10000000-0000-4000-8000-000000000013',
    'USR003',
    'usuario03@empresa1.pe',
    'Usuario 03',
    'Usuario 03',
    '$2b$10$LEEhiwHbqoVWWtIkUsBuMe3uIT5Wq5dyrPZq2sAFnR/oI1RY7lkj6',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 04: PLANNER_MAINTENANCE_02
(
    '10000000-0000-4000-8000-000000000014',
    'USR004',
    'usuario04@empresa1.pe',
    'Usuario 04',
    'Usuario 04',
    '$2b$10$tkWp8cQDmtOWEq1UaOY3yejOs0VxFe4FWLBmtbrDLJ4.s4zso11mq',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 05: COORDINATOR_MAINTENANCE_01
(
    '10000000-0000-4000-8000-000000000015',
    'USR005',
    'usuario05@empresa1.pe',
    'Usuario 05',
    'Usuario 05',
    '$2b$10$Yz/LILNkT5dIXFSiUV4OIeKmvLmsEpNnFcy2YRpPmGoO/ZqSdJqhe',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 06: COORDINATOR_MAINTENANCE_02
(
    '10000000-0000-4000-8000-000000000016',
    'USR006',
    'usuario06@empresa1.pe',
    'Usuario 06',
    'Usuario 06',
    '$2b$10$4ATRQotUt8n6cm.KP0ree.dOKwbKSaIKx3h3son3h7zSzlGk1PQVO',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 07: SUPERVISOR_MAINTENANCE_01
(
    '10000000-0000-4000-8000-000000000017',
    'USR007',
    'usuario07@empresa1.pe',
    'Usuario 07',
    'Usuario 07',
    '$2b$10$v1HyRgUVQW11xxdINCot2uxrRmZvdnjZ7QkaMjujJwjPWBU6XqeN2',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 08: SUPERVISOR_MAINTENANCE_02
(
    '10000000-0000-4000-8000-000000000018',
    'USR008',
    'usuario08@empresa1.pe',
    'Usuario 08',
    'Usuario 08',
    '$2b$10$ddFRUH668ZRwrhGkGJ5ltuoIbfuo2k774QS1xrZ0kDmZagdeks7AO',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 09: TECHNICIAN_MAINTENANCE_01
(
    '10000000-0000-4000-8000-000000000019',
    'USR009',
    'usuario09@empresa1.pe',
    'Usuario 09',
    'Usuario 09',
    '$2b$10$G3ium9fiBCRvD55X0nPaBOGvRFik5KyizmjyC1csvEV9pnuU.gCLC',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 10: TECHNICIAN_MAINTENANCE_02
(
    '10000000-0000-4000-8000-00000000001A',
    'USR010',
    'usuario10@empresa1.pe',
    'Usuario 10',
    'Usuario 10',
    '$2b$10$7iBJXkCss9r4395YIGhHcu1qpSrQ4WiO1qneLcbT89k80qM7f8wEm',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
),

-- User 11: TECHNICIAN_MAINTENANCE_02 + SUPERVISOR_MAINTENANCE_01
(
    '10000000-0000-4000-8000-00000000001B',
    'USR011',
    'usuario11@empresa1.pe',
    'Usuario 11',
    'Usuario 11',
    '$2b$10$r38lNygrM9SKumymth44aePigEktQNb.u/gk9daxKLvubq49HdRfy',
    '2026-08-01T08:00:00-05:00',
    'Y',
    'N'
);

GO





-- =====================================================================
-- 3. ROLE-BASED PERMISSIONS (user_org_permissions)
--    permissions / denied_permissions = JSON string array.
--    The gateway calculates:
--      userPermissions = (union of permissions) - (union of denied)
--      userRoles       = [roleCode...]
-- =====================================================================
INSERT INTO [dbo].[user_org_permissions]
    ([id], [user_id], [organization_id], [role_code], [role_name],
     [role_description], [permissions], [denied_permissions],
     [is_active], [created_at], [updated_at], [assigned_at])
VALUES
    -- USR001 -> ADMIN: all permissions (local + oracle)
    ('10000000-0000-4000-8000-0000000000C1',
     '10000000-0000-4000-8000-000000000011',
     '10000000-0000-4000-8000-000000000001',
      'ADMIN', 'System administrator',
      'Full access to all CMMS functions',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.orders.cancel","mnt.work.request.create","mnt.work.request.update","mnt.work.request.complete","mnt.work.request.cancel","oracle.mnt.work.orders.create","oracle.mnt.work.orders.update","oracle.mnt.work.orders.cancel"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR002 -> MANUFACTURING_FACILITATOR: creates/cancels work requests + their WOs
    ('10000000-0000-4000-8000-0000000000C2',
     '10000000-0000-4000-8000-000000000012',
     '10000000-0000-4000-8000-000000000001',
      'MANUFACTURING_FACILITATOR', 'Manufacturing facilitator',
      'Creates, updates and cancels work requests (Emergency subtype)',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.orders.cancel","mnt.work.request.create","mnt.work.request.update","mnt.work.request.complete","mnt.work.request.cancel","oracle.mnt.work.orders.create","oracle.mnt.work.orders.cancel"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR003 -> PLANNER_MAINTENANCE_01: no cancel (denied simulates denial)
    ('10000000-0000-4000-8000-0000000000C3',
     '10000000-0000-4000-8000-000000000013',
     '10000000-0000-4000-8000-000000000001',
      'PLANNER_MAINTENANCE_01', 'Maintenance planner 1',
      'Plans work orders (Preventive/Corrective/Emergency/Inspection). Cannot cancel',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.request.complete","oracle.mnt.work.orders.create","oracle.mnt.work.orders.update","oracle.mnt.work.orders.cancel"]',
     '["mnt.work.orders.cancel","mnt.work.request.cancel"]',
     'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR004 -> PLANNER_MAINTENANCE_02: allows canceling WOs (contrast with USR003)
    ('10000000-0000-4000-8000-0000000000C4',
     '10000000-0000-4000-8000-000000000014',
     '10000000-0000-4000-8000-000000000001',
      'PLANNER_MAINTENANCE_02', 'Maintenance planner 2',
      'Plans work orders (Preventive/Corrective/Emergency/Inspection). Can cancel',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.orders.cancel","mnt.work.request.complete","oracle.mnt.work.orders.create","oracle.mnt.work.orders.update","oracle.mnt.work.orders.cancel"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR005 -> COORDINATOR_MAINTENANCE_01
    ('10000000-0000-4000-8000-0000000000C5',
     '10000000-0000-4000-8000-000000000015',
     '10000000-0000-4000-8000-000000000001',
      'COORDINATOR_MAINTENANCE_01', 'Maintenance coordinator 1',
      'Coordinates maintenance (Preventive/Corrective/Emergency). Completes work requests',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.orders.cancel","mnt.work.request.complete","oracle.mnt.work.orders.create","oracle.mnt.work.orders.update","oracle.mnt.work.orders.cancel"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR006 -> COORDINATOR_MAINTENANCE_02: cannot cancel WOs (denied)
    ('10000000-0000-4000-8000-0000000000C6',
     '10000000-0000-4000-8000-000000000016',
     '10000000-0000-4000-8000-000000000001',
      'COORDINATOR_MAINTENANCE_02', 'Maintenance coordinator 2',
      'Coordinates maintenance (Preventive/Corrective/Emergency). Cannot cancel',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.request.complete"]',
     '["mnt.work.orders.cancel"]',
     'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR007 -> SUPERVISOR_MAINTENANCE_01 (Emergency only)
     ('10000000-0000-4000-8000-0000000000C7',
     '10000000-0000-4000-8000-000000000017',
     '10000000-0000-4000-8000-000000000001',
     'SUPERVISOR_MAINTENANCE_01', 'Maintenance supervisor 1',
     'Supervises emergency maintenance and completes work requests',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.request.complete"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR008 -> SUPERVISOR_MAINTENANCE_02: cannot update WOs (denied)
    ('10000000-0000-4000-8000-0000000000C8',
     '10000000-0000-4000-8000-000000000018',
     '10000000-0000-4000-8000-000000000001',
      'SUPERVISOR_MAINTENANCE_02', 'Maintenance supervisor 2',
      'Supervises emergency maintenance. Cannot edit orders',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.request.complete"]',
     '["mnt.work.orders.update"]',
     'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR009 -> TECHNICIAN_MAINTENANCE_01 (Corrective only)
    ('10000000-0000-4000-8000-0000000000C9',
     '10000000-0000-4000-8000-000000000019',
     '10000000-0000-4000-8000-000000000001',
      'TECHNICIAN_MAINTENANCE_01', 'Maintenance technician 1',
      'Executes corrective maintenance and completes work requests',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.request.complete"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR010 -> TECHNICIAN_MAINTENANCE_02 (Corrective/Emergency/Inspection)
    ('10000000-0000-4000-8000-0000000000CA',
     '10000000-0000-4000-8000-00000000001A',
     '10000000-0000-4000-8000-000000000001',
     'TECHNICIAN_MAINTENANCE_02', 'Maintenance technician 2',
     'Executes corrective, emergency and inspection maintenance',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.request.complete","oracle.mnt.work.orders.create"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR011 -> TECHNICIAN_MAINTENANCE_02 (same set as USR010)
     ('10000000-0000-4000-8000-0000000000CB',
      '10000000-0000-4000-8000-00000000001B',
      '10000000-0000-4000-8000-000000000001',
      'TECHNICIAN_MAINTENANCE_02', 'Maintenance technician 2',
      'Executes corrective, emergency and inspection maintenance',
      '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.orders.update","mnt.work.request.complete","oracle.mnt.work.orders.create"]',
      NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- USR011 -> SUPERVISOR_MAINTENANCE_01 (dual role; union of permissions)
    ('10000000-0000-4000-8000-0000000000CC',
     '10000000-0000-4000-8000-00000000001B',
     '10000000-0000-4000-8000-000000000001',
     'SUPERVISOR_MAINTENANCE_01', 'Maintenance supervisor 1',
     'Supervises emergency maintenance and completes work requests',
     '["mnt.work.orders.view","mnt.work.orders.create","mnt.work.request.complete"]',
     NULL, 'Y', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00');
GO