-- =====================================================================
-- 02_asset_management_ms.sql
-- Mock data for the ASSET-MANAGEMENT microservice DB
-- (cv-cmms-asset-management-ms).
--
-- Contents:
--   1) Organization ORG-LIMA-001 (Empresa 1) - same as in auth-ms
--   2) 3 Work Areas
--   3) 4 Work Centers
--   4) 6 Assets (mining/plant equipment)
--
-- Relationships:
--   work_centers -> work_areas (work_area_id)
--   mnt_assets   -> work_centers (work_center_id)
-- =====================================================================

-- =====================================================================
-- 1. ORGANIZATION (must match 01_auth_ms.sql)
-- =====================================================================
INSERT INTO [dbo].[organizations]
    ([id], [code], [name], [country_code], [country_name], [timezone],
     [offset_minutes], [created_at], [updated_at], [is_active])
VALUES
    ('10000000-0000-4000-8000-000000000001', 'ORG-LIMA-001', 'Empresa 1',
     'PE', 'Peru', 'America/Lima', -300,
     '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', 'Y');

-- =====================================================================
-- 2. WORK AREAS
-- =====================================================================
INSERT INTO [dbo].[work_areas]
    ([work_area_id], [work_area_code], [work_area_description],
     [organization_code], [is_active], [created_at], [updated_at])
VALUES
     ('10000000-0000-4000-8000-0000000000A1', 'WA-001',
      'Production Area 1', 'ORG-LIMA-001', 'Y',
      '2026-08-01T08:00:00-05:00', NULL),
    ('10000000-0000-4000-8000-0000000000A2', 'WA-002',
      'Grinding Area', 'ORG-LIMA-001', 'Y',
      '2026-08-01T08:00:00-05:00', NULL),
    ('10000000-0000-4000-8000-0000000000A3', 'WA-003',
      'Energy and Services Area', 'ORG-LIMA-001', 'Y',
     '2026-08-01T08:00:00-05:00', NULL);

-- =====================================================================
-- 3. WORK CENTERS
-- =====================================================================
INSERT INTO [dbo].[work_centers]
    ([work_center_id], [work_center_code], [work_center_description],
     [work_area_id], [center_cost_code], [center_cost_description],
     [is_active], [created_at], [updated_at])
VALUES
     ('10000000-0000-4000-8000-0000000000B1', 'WC-001',
      'Central Mechanical Workshop', '10000000-0000-4000-8000-0000000000A1',
      1001, 'Cost center 1001 - Mechanical maintenance', 'Y',
      '2026-08-01T08:00:00-05:00', NULL),
    ('10000000-0000-4000-8000-0000000000B2', 'WC-002',
      'Grinding Workshop', '10000000-0000-4000-8000-0000000000A2',
      1002, 'Cost center 1002 - Grinding', 'Y',
      '2026-08-01T08:00:00-05:00', NULL),
    ('10000000-0000-4000-8000-0000000000B3', 'WC-003',
      'Electrical Workshop', '10000000-0000-4000-8000-0000000000A1',
      1003, 'Cost center 1003 - Electrical maintenance', 'Y',
      '2026-08-01T08:00:00-05:00', NULL),
    ('10000000-0000-4000-8000-0000000000B4', 'WC-004',
      'General Services', '10000000-0000-4000-8000-0000000000A3',
      1004, 'Cost center 1004 - General services', 'Y',
     '2026-08-01T08:00:00-05:00', NULL);
GO

-- =====================================================================
-- 4. ASSETS (mnt_assets)
--    Same asset_code that will be inserted in maintenance-execution.
-- =====================================================================
INSERT INTO [dbo].[mnt_assets]
    ([asset_code], [asset_description], [asset_short_description],
     [asset_status], [organization_code], [organization_name],
     [country_code], [country_name], [work_center_id], [work_center_code],
     [work_center_description], [center_cost_code], [work_area_code],
     [work_area_description], [accounting_account_code], [supervisor_code],
     [asset_dependency], [process_type_code], [subprocess_type_code],
     [hierarchy_code], [class], [enabled_maintenance_program],
     [enabled_maintenance_hours_control], [enabled_financial_kpi],
     [enabled_technical_kpi], [wo_allowed_flag], [created_by],
     [created_at], [enabled_iiot], [sector], [subsector], [is_active])
VALUES
    -- AST-001: Primary jaw crusher
    ('AST-001', 'Primary jaw crusher', 'Primary crusher',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     '10000000-0000-4000-8000-0000000000B2', 'WC-002', 'Grinding Workshop',
     1002, 'WA-002', 'Grinding Area', NULL, NULL, NULL, 'PROC-01',
     NULL, NULL, NULL, 'Y', 'Y', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Crushing', 'Y'),

    -- AST-002: Ball mill
    ('AST-002', 'Ball mill 12 x 14 ft', 'Ball mill',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     '10000000-0000-4000-8000-0000000000B2', 'WC-002', 'Grinding Workshop',
     1002, 'WA-002', 'Grinding Area', NULL, NULL, NULL, 'PROC-02',
     NULL, NULL, NULL, 'Y', 'Y', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Grinding', 'Y'),

    -- AST-003: Centrifugal slurry pump
    ('AST-003', 'Centrifugal slurry pump', 'Slurry pump',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     '10000000-0000-4000-8000-0000000000B1', 'WC-001', 'Central Mechanical Workshop',
     1001, 'WA-001', 'Production Area 1', NULL, NULL, NULL, 'PROC-03',
     NULL, NULL, NULL, 'Y', 'Y', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Slurry pumping', 'Y'),

    -- AST-004: Conveyor belt N1
    ('AST-004', 'Conveyor belt N 1', 'Conveyor belt',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     '10000000-0000-4000-8000-0000000000B1', 'WC-001', 'Central Mechanical Workshop',
     1001, 'WA-001', 'Production Area 1', NULL, NULL, NULL, 'PROC-04',
     NULL, NULL, NULL, 'Y', 'N', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Ore transport', 'Y'),

    -- AST-005: Diesel generator
    ('AST-005', 'Diesel generator 500 kVA', 'Generator',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     '10000000-0000-4000-8000-0000000000B4', 'WC-004', 'General Services',
     1004, 'WA-003', 'Energy and Services Area', NULL, NULL, NULL, 'PROC-05',
     NULL, NULL, NULL, 'Y', 'N', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Energy', 'Emergency generation', 'Y'),

    -- AST-006: Industrial air compressor
    ('AST-006', 'Industrial air compressor', 'Air compressor',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     '10000000-0000-4000-8000-0000000000B3', 'WC-003', 'Electrical Workshop',
     1003, 'WA-001', 'Production Area 1', NULL, NULL, NULL, 'PROC-06',
     NULL, NULL, NULL, 'Y', 'N', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Energy', 'Compressed air', 'Y');
GO