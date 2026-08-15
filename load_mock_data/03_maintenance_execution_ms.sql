-- =====================================================================
-- 03_maintenance_execution_ms.sql
-- Mock data for the MAINTENANCE-EXECUTION microservice DB
-- (cv-cmms-maintenance-execution-ms).
--
-- Contents:
--   1) 6 assets (same asset_code as in asset-management)
--   2) Human resources (mnt_human_resources)
--   3) Work requests (with IDENTITY_INSERT: 900000001...)
--   4) Work orders (1001...1005) with their lifecycle
--   5) Operations, materials and HR usage associated
--
-- All planned_* fields are set to NULL since the system no longer uses
-- them for calculations. Only actual_* fields drive the business logic.
--
-- IMPORTANT: A human resource with resource_code = 'DEFAULT_RESOURCE' MUST
-- exist as initial data. Work Requests created via the gateway auto-generate
-- a default operation that references this resource code; without it the
-- insert into mnt_operation_human_resource_usages fails (FK violation).
-- =====================================================================

-- =====================================================================
-- 1. ASSETS (mnt_assets)
-- =====================================================================
INSERT INTO [dbo].[mnt_assets]
    ([asset_code], [asset_description], [asset_short_description],
     [asset_status], [organization_code], [organization_name],
     [country_code], [country_name], [work_center_code],
     [work_center_description], [center_cost_code], [work_area_code],
     [work_area_description], [enabled_maintenance_program],
     [enabled_maintenance_hours_control], [enabled_financial_kpi],
     [enabled_technical_kpi], [wo_allowed_flag], [created_by],
     [created_at], [enabled_iiot], [sector], [subsector], [is_active])
VALUES
    ('AST-001', 'Primary jaw crusher', 'Primary crusher',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Y', 'Y', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Crushing', 'Y'),

    ('AST-002', 'Ball mill 12 x 14 ft', 'Ball mill',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Y', 'Y', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Grinding', 'Y'),

    ('AST-003', 'Centrifugal slurry pump', 'Slurry pump',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     'WC-001', 'Central Mechanical Workshop', 1001, 'WA-001',
     'Production Area 1', 'Y', 'Y', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Slurry pumping', 'Y'),

    ('AST-004', 'Conveyor belt N 1', 'Conveyor belt',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     'WC-001', 'Central Mechanical Workshop', 1001, 'WA-001',
     'Production Area 1', 'Y', 'N', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Mining', 'Ore transport', 'Y'),

    ('AST-005', 'Diesel generator 500 kVA', 'Generator',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     'WC-004', 'General Services', 1004, 'WA-003',
     'Energy and Services Area', 'Y', 'N', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Energy', 'Emergency generation', 'Y'),

    ('AST-006', 'Industrial air compressor', 'Air compressor',
     'OPERATIVE', 'ORG-LIMA-001', 'Empresa 1', 'PE', 'Peru',
     'WC-003', 'Electrical Workshop', 1003, 'WA-001',
     'Production Area 1', 'Y', 'N', 'N', 'Y', 'Y', 'USR001',
     '2026-08-01T08:00:00-05:00', 'N', 'Energy', 'Compressed air', 'Y');
GO

-- =====================================================================
-- 2. HUMAN RESOURCES (mnt_human_resources)
-- =====================================================================
INSERT INTO [dbo].[mnt_human_resources]
    ([resource_code], [resource_name], [resource_type],
     [organization_code], [organization_name], [availability_status],
     [supervisor_id], [supervisor_name], [is_active],
     [created_at], [created_by], [created_by_name])
VALUES
    ('RES-001', 'Mechanical Technician 1', 'MECHANICAL',
     'ORG-LIMA-001', 'Empresa 1', 'AVAILABLE',
     '10000000-0000-4000-8000-000000000017', 'User 07', 'Y',
     '2026-08-01T08:00:00-05:00', '10000000-0000-4000-8000-000000000011', 'User 01'),

    ('RES-002', 'Mechanical Technician 2', 'MECHANICAL',
     'ORG-LIMA-001', 'Empresa 1', 'AVAILABLE',
     '10000000-0000-4000-8000-000000000017', 'User 07', 'Y',
     '2026-08-01T08:00:00-05:00', '10000000-0000-4000-8000-000000000011', 'User 01'),

    ('RES-003', 'Electrical Technician 1', 'ELECTRICAL',
     'ORG-LIMA-001', 'Empresa 1', 'AVAILABLE',
     '10000000-0000-4000-8000-000000000018', 'User 08', 'Y',
     '2026-08-01T08:00:00-05:00', '10000000-0000-4000-8000-000000000011', 'User 01'),

    ('RES-004', 'Instrumentation Technician 1', 'INSTRUMENTATION',
     'ORG-LIMA-001', 'Empresa 1', 'AVAILABLE',
     '10000000-0000-4000-8000-000000000018', 'User 08', 'Y',
     '2026-08-01T08:00:00-05:00', '10000000-0000-4000-8000-000000000011', 'User 01'),

('RES-005', 'Crushing Operator', 'OPERATOR',
      'ORG-LIMA-001', 'Empresa 1', 'AVAILABLE',
      '10000000-0000-4000-8000-000000000017', 'User 07', 'Y',
      '2026-08-01T08:00:00-05:00', '10000000-0000-4000-8000-000000000011', 'User 01'),

    -- DEFAULT_RESOURCE is required: Work Requests created via the gateway
    -- auto-generate a default operation that references this resource code.
    -- At least one DEFAULT_RESOURCE row SHALL exist per environment.
    ('DEFAULT_RESOURCE', 'Default Resource', 'GENERAL',
     'ORG-LIMA-001', 'Empresa 1', 'AVAILABLE',
     '10000000-0000-4000-8000-000000000017', 'User 07', 'Y',
     '2026-08-01T08:00:00-05:00', '10000000-0000-4000-8000-000000000011', 'User 01');
GO

-- =====================================================================
-- 3. WORK REQUESTS (mnt_work_request)
-- =====================================================================
SET IDENTITY_INSERT [dbo].[mnt_work_request] ON;

INSERT INTO [dbo].[mnt_work_request]
    ([request_id], [asset_code], [asset_short_description],
     [issue_description], [status_code], [requested_at], [completed_at],
     [released_at], [canceled_at], [work_center_code],
     [work_center_description], [center_cost_code], [work_area_code],
     [work_area_description], [sector], [subsector], [organization_code],
     [organization_name], [created_by], [created_by_name], [created_at])
VALUES
    (900000001, 'AST-001', 'Primary crusher',
     'Excessive vibration in primary crusher detected during operation',
     'RELEASED', '2026-08-01T08:00:00-05:00', NULL,
     '2026-08-01T08:00:00-05:00', NULL,
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Mining', 'Crushing', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '2026-08-01T08:00:00-05:00'),

    (900000002, 'AST-003', 'Slurry pump',
     'Slurry leak in mechanical seal of the slurry pump',
     'COMPLETED', '2026-08-02T09:00:00-05:00',
     '2026-08-03T12:00:00-05:00', '2026-08-02T09:00:00-05:00', NULL,
     'WC-001', 'Central Mechanical Workshop', 1001, 'WA-001',
     'Production Area 1', 'Mining', 'Slurry pumping',
     'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '2026-08-02T09:00:00-05:00'),

    (900000003, 'AST-005', 'Generator',
     'Emergency generator does not start',
     'CANCELED', '2026-08-04T10:00:00-05:00', NULL,
     '2026-08-04T10:00:00-05:00', '2026-08-05T09:00:00-05:00',
     'WC-004', 'General Services', 1004, 'WA-003',
     'Energy and Services Area', 'Energy', 'Emergency generation',
     'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '2026-08-04T10:00:00-05:00');

SET IDENTITY_INSERT [dbo].[mnt_work_request] OFF;
GO

-- =====================================================================
-- 4. WORK ORDERS (mnt_work_orders)
--    Columns match Prisma schema order.
--    All planned_* fields are NULL (not used in business logic).
-- =====================================================================
SET IDENTITY_INSERT [dbo].[mnt_work_orders] ON;

INSERT INTO [dbo].[mnt_work_orders]
    ([work_order_code], [work_order_description], [asset_code],
     [asset_short_description], [work_order_type], [work_order_sub_type],
     [work_definition_code], [work_order_priority], [wo_status_code],
     [scheduling_method],
     [planned_start_date], [planned_completion_date], [planned_hours],
     [actual_start_date], [actual_completion_date],
     [actual_hours], [released_date], [closed_date], [canceled_date],
     [canceled_reason], [need_by_date], [work_request_id],
     [work_center_code], [work_center_description], [center_cost_code],
     [work_area_code], [work_area_description], [sector], [subsector],
     [organization_code], [organization_name], [created_by],
     [created_by_name], [updated_by], [updated_by_name],
     [ocl_work_order_id], [ocl_work_order_number],
     [enable_oracle_work_order], [total_man_hours],
     [total_supplier_hours], [created_at], [updated_at])
VALUES
    -- 1001: Emergency RELEASED (from WR 900000001)
    (1001, 'Excessive vibration in primary crusher detected during operation',
     'AST-001', 'Primary crusher',
     'Not Planned', 'Emergency', NULL, '1', 'RELEASED',
     NULL,
     NULL, NULL, NULL,
     '2026-08-01T08:00:00-05:00', '2026-08-01T09:00:00-05:00',
     1,
     '2026-08-01T08:00:00-05:00', NULL, NULL, NULL,
     '2026-08-03T08:00:00-05:00', 900000001,
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Mining', 'Crushing', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     NULL, NULL,
     'N', 1, 0,
     '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- 1002: Preventive UNRELEASED
    (1002, 'Preventive maintenance for ball mill 12x14',
     'AST-002', 'Ball mill',
     'Planned', 'Preventive', NULL, '2', 'UNRELEASED',
     NULL,
     NULL, NULL, NULL,
     '2026-08-10T08:00:00-05:00', '2026-08-10T13:30:00-05:00',
     5,
     NULL, NULL, NULL, NULL,
     '2026-08-12T08:00:00-05:00', NULL,
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Mining', 'Grinding', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     NULL, NULL,
     'N', 5, 0,
     '2026-08-06T08:00:00-05:00', '2026-08-06T08:00:00-05:00'),

    -- 1003: Corrective RELEASED
    (1003, 'Splice repair on conveyor belt N 1',
     'AST-004', 'Conveyor belt',
     'Planned', 'Corrective', NULL, '1', 'RELEASED',
     NULL,
     NULL, NULL, NULL,
     '2026-08-04T08:00:00-05:00', '2026-08-04T12:00:00-05:00',
     4,
     '2026-08-04T08:00:00-05:00', NULL, NULL, NULL,
     '2026-08-06T08:00:00-05:00', NULL,
     'WC-001', 'Central Mechanical Workshop', 1001, 'WA-001',
     'Production Area 1', 'Mining', 'Ore transport',
     'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     NULL, NULL,
     'N', 4, 0,
     '2026-08-04T08:00:00-05:00', '2026-08-04T08:00:00-05:00'),

    -- 1004: Inspection CLOSED
    (1004, 'Annual inspection of industrial air compressor',
     'AST-006', 'Air compressor',
     'Planned', 'Inspection', NULL, '3', 'CLOSED',
     NULL,
     NULL, NULL, NULL,
     '2026-08-02T08:00:00-05:00', '2026-08-02T12:00:00-05:00',
     4,
     '2026-08-02T08:00:00-05:00', '2026-08-03T10:00:00-05:00',
     NULL, NULL, NULL, NULL,
     'WC-003', 'Electrical Workshop', 1003, 'WA-001', 'Production Area 1',
     'Energy', 'Compressed air', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000014', 'User 04',
     '10000000-0000-4000-8000-000000000014', 'User 04',
     NULL, NULL,
     'N', 4, 0,
     '2026-08-02T08:00:00-05:00', '2026-08-02T08:00:00-05:00'),

    -- 1005: Emergency CANCELED
    (1005, 'Emergency generator does not start',
     'AST-005', 'Generator',
     'Not Planned', 'Emergency', NULL, '1', 'CANCELED',
     NULL,
     NULL, NULL, NULL,
     NULL, NULL,
     NULL,
     '2026-08-04T10:00:00-05:00', NULL,
     '2026-08-05T09:00:00-05:00',
     'Startup spare parts not available', NULL, 900000003,
     'WC-004', 'General Services', 1004, 'WA-003',
     'Energy and Services Area', 'Energy', 'Emergency generation',
     'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     NULL, NULL,
     'N', NULL, NULL,
     '2026-08-04T10:00:00-05:00', '2026-08-04T10:00:00-05:00');

SET IDENTITY_INSERT [dbo].[mnt_work_orders] OFF;
GO

-- =====================================================================
-- 5. OPERATIONS (mnt_wo_operations)
--    All planned_* fields are NULL.
--    Columns match Prisma schema order.
-- =====================================================================
SET IDENTITY_INSERT [dbo].[mnt_wo_operations] ON;

INSERT INTO [dbo].[mnt_wo_operations]
    ([operation_code], [operation_name], [operation_description],
     [operation_seq_number], [work_order_code], [asset_code],
     [asset_short_description], [unit], [subunit], [maintainable_item],
     [operation_category], [operation_sub_type],
     [operation_status], [operation_type],
     [planned_start_date], [planned_completion_date], [planned_hours],
     [actual_start_date], [actual_completion_date], [actual_hours],
     [ocl_work_order_id], [ocl_work_order_number],
     [work_center_code], [work_center_description],
     [center_cost_code], [work_area_code], [work_area_description],
     [sector], [subsector], [organization_code], [organization_name],
     [created_by], [created_by_name],
     [updated_by], [updated_by_name],
     [reviewed_by], [reviewed_by_name],
     [created_at], [updated_at], [reviewed_at])
VALUES
    -- 5006: default operation (WO 1001, Emergency, RELEASED)
    (5006, 'DEFAULT_OPERATION', 'Auto-generated default operation',
     1, 1001, 'AST-001', 'Primary crusher', NULL, NULL, NULL,
     NULL, 'Emergency',
     'RELEASED', 'Internal',
     NULL, NULL, NULL,
     '2026-08-01T08:00:00-05:00', '2026-08-01T09:00:00-05:00',
     1,
     NULL, NULL,
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Mining', 'Crushing', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     NULL, NULL,
     '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00', NULL),

    -- 5001: Bearing lubrication (WO 1002, Preventive, UNRELEASED)
    (5001, 'Bearing lubrication',
     'Ball mill bearing lubrication',
     10, 1002, 'AST-002', 'Ball mill', NULL, NULL, NULL,
     NULL, 'Preventive',
     'UNRELEASED', 'Internal',
     NULL, NULL, NULL,
     '2026-08-10T08:00:00-05:00', '2026-08-10T10:00:00-05:00',
     2,
     NULL, NULL,
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Mining', 'Grinding', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     NULL, NULL,
     '2026-08-06T08:00:00-05:00', '2026-08-06T08:00:00-05:00', NULL),

    -- 5002: Roller inspection (WO 1002, Preventive, UNRELEASED)
    (5002, 'Roller and motor inspection',
     'Visual inspection of mill rollers and motor',
     20, 1002, 'AST-002', 'Ball mill', NULL, NULL, NULL,
     NULL, 'Preventive',
     'UNRELEASED', 'Internal',
     NULL, NULL, NULL,
     '2026-08-10T10:30:00-05:00', '2026-08-10T13:30:00-05:00',
     3,
     NULL, NULL,
     'WC-002', 'Grinding Workshop', 1002, 'WA-002', 'Grinding Area',
     'Mining', 'Grinding', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     NULL, NULL,
     '2026-08-06T08:00:00-05:00', '2026-08-06T08:00:00-05:00', NULL),

    -- 5003: Splice replacement (WO 1003, Corrective, RELEASED)
    (5003, 'Splice replacement',
     'Replacement of vulcanized splice on conveyor belt',
     10, 1003, 'AST-004', 'Conveyor belt', NULL, NULL, NULL,
     NULL, 'Corrective',
     'RELEASED', 'Internal',
     NULL, NULL, NULL,
     '2026-08-04T08:00:00-05:00', '2026-08-04T12:00:00-05:00',
     4,
     NULL, NULL,
     'WC-001', 'Central Mechanical Workshop', 1001, 'WA-001',
     'Production Area 1', 'Mining', 'Ore transport',
     'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     NULL, NULL,
     '2026-08-04T08:00:00-05:00', '2026-08-04T08:00:00-05:00', NULL),

    -- 5004: Annual inspection (WO 1004, Inspection, COMPLETED)
    (5004, 'Annual compressor inspection',
     'Mechanical and electrical inspection of air compressor',
     10, 1004, 'AST-006', 'Air compressor', NULL, NULL, NULL,
     NULL, 'Inspection',
     'COMPLETED', 'Internal',
     NULL, NULL, NULL,
     '2026-08-02T08:00:00-05:00', '2026-08-02T12:00:00-05:00',
     4,
     NULL, NULL,
     'WC-003', 'Electrical Workshop', 1003, 'WA-001', 'Production Area 1',
     'Energy', 'Compressed air', 'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000015', 'User 05',
     '10000000-0000-4000-8000-000000000015', 'User 05',
     NULL, NULL,
     '2026-08-02T08:00:00-05:00', '2026-08-02T08:00:00-05:00', NULL),

    -- 5005: Emergency repair (WO 1005, Emergency, CANCELED)
    (5005, 'Emergency generator repair',
     'Attempted repair of emergency generator',
     10, 1005, 'AST-005', 'Generator', NULL, NULL, NULL,
     NULL, 'Emergency',
     'CANCELED', 'Internal',
     NULL, NULL, NULL,
     NULL, NULL, NULL,
     NULL, NULL,
     'WC-004', 'General Services', 1004, 'WA-003',
     'Energy and Services Area', 'Energy', 'Emergency generation',
     'ORG-LIMA-001', 'Empresa 1',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     NULL, NULL,
     '2026-08-04T10:00:00-05:00', '2026-08-04T10:00:00-05:00', NULL);

SET IDENTITY_INSERT [dbo].[mnt_wo_operations] OFF;
GO

-- =====================================================================
-- 6. MATERIALS USED (mnt_operation_material_usages)
-- =====================================================================
SET IDENTITY_INSERT [dbo].[mnt_operation_material_usages] ON;

INSERT INTO [dbo].[mnt_operation_material_usages]
    ([id], [operation_code], [organization_code], [material_code],
     [material_name], [quantity], [unit_cost], [total_cost], [supply_type],
     [material_sequence_number], [transacted_in_oracle], [created_by],
     [created_by_name], [created_at])
VALUES
    (9001, 5003, 'ORG-LIMA-001', 'MAT-001',
     'Vulcanized belt splice', 1, 250.00, 250.00, '1', 10, 'N',
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     '2026-08-04T08:00:00-05:00'),

    (9002, 5004, 'ORG-LIMA-001', 'MAT-002',
     'Air filter', 2, 80.00, 160.00, '1', 10, 'N',
     '10000000-0000-4000-8000-000000000015', 'User 05',
     '2026-08-02T08:00:00-05:00'),

    (9003, 5001, 'ORG-LIMA-001', 'MAT-003',
     'EP2 lubricating grease', 3, 12.50, 37.50, '1', 10, 'N',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '2026-08-06T08:00:00-05:00');

SET IDENTITY_INSERT [dbo].[mnt_operation_material_usages] OFF;
GO

-- =====================================================================
-- 7. HUMAN RESOURCE USAGE (mnt_operation_human_resource_usages)
--    All planned_* fields are NULL.
--    ACTIVE resources have actual_start_date, actual_completion_date, actual_hours.
--    CANCELED resources may have NULL for actual fields.
-- =====================================================================
SET IDENTITY_INSERT [dbo].[mnt_operation_human_resource_usages] ON;

INSERT INTO [dbo].[mnt_operation_human_resource_usages]
    ([id], [operation_code], [organization_code], [resource_code],
     [actual_hours], [hourly_cost], [principal_flag],
     [resource_sequence_number],
     [actual_start_date], [actual_completion_date],
     [planned_start_date], [planned_completion_date], [planned_hours],
     [status], [canceled_reason],
     [transacted_in_oracle], [ocl_wo_operation_resource_id], [synced_to_oracle_at],
     [created_by], [created_by_name],
     [updated_by], [updated_by_name],
     [created_at], [updated_at])
VALUES
    -- Op 5001: Technician 1 (principal) - WO 1002 UNRELEASED
    (9101, 5001, 'ORG-LIMA-001', 'RES-001',
     2, 35.00, 'Y', 1,
     '2026-08-10T08:00:00-05:00', '2026-08-10T10:00:00-05:00',
     NULL, NULL, NULL,
     'ACTIVE', NULL,
     'N', NULL, NULL,
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '2026-08-06T08:00:00-05:00', '2026-08-06T08:00:00-05:00'),

    -- Op 5002: Technician 1 (principal) - sequence 1
    (9102, 5002, 'ORG-LIMA-001', 'RES-001',
     2, 35.00, 'Y', 1,
     '2026-08-10T10:30:00-05:00', '2026-08-10T12:30:00-05:00',
     NULL, NULL, NULL,
     'ACTIVE', NULL,
     'N', NULL, NULL,
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '2026-08-06T08:00:00-05:00', '2026-08-06T08:00:00-05:00'),

    -- Op 5002: Instrumentation tech 1 (secondary) - sequence 2
    (9103, 5002, 'ORG-LIMA-001', 'RES-004',
     1, 45.00, 'N', 2,
     '2026-08-10T12:30:00-05:00', '2026-08-10T13:30:00-05:00',
     NULL, NULL, NULL,
     'ACTIVE', NULL,
     'N', NULL, NULL,
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '10000000-0000-4000-8000-000000000013', 'User 03',
     '2026-08-06T08:00:00-05:00', '2026-08-06T08:00:00-05:00'),

    -- Op 5003: Technician 2 (principal) - WO 1003 RELEASED
    (9104, 5003, 'ORG-LIMA-001', 'RES-002',
     4, 40.00, 'Y', 1,
     '2026-08-04T08:00:00-05:00', '2026-08-04T12:00:00-05:00',
     NULL, NULL, NULL,
     'ACTIVE', NULL,
     'N', NULL, NULL,
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     '10000000-0000-4000-8000-00000000001A', 'User 10',
     '2026-08-04T08:00:00-05:00', '2026-08-04T08:00:00-05:00'),

    -- Op 5004: Electrical tech 1 (principal) - WO 1004 CLOSED
    (9105, 5004, 'ORG-LIMA-001', 'RES-003',
     4, 38.00, 'Y', 1,
     '2026-08-02T08:00:00-05:00', '2026-08-02T12:00:00-05:00',
     NULL, NULL, NULL,
     'ACTIVE', NULL,
     'N', NULL, NULL,
     '10000000-0000-4000-8000-000000000015', 'User 05',
     '10000000-0000-4000-8000-000000000015', 'User 05',
     '2026-08-02T08:00:00-05:00', '2026-08-02T08:00:00-05:00'),

    -- Op 5006: Default resource for WO 1001 (from WR 900000001)
    (9107, 5006, 'ORG-LIMA-001', 'DEFAULT_RESOURCE',
     1, 35.00, 'N', 0,
     '2026-08-01T08:00:00-05:00', '2026-08-01T09:00:00-05:00',
     NULL, NULL, NULL,
     'ACTIVE', NULL,
     'N', NULL, NULL,
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '2026-08-01T08:00:00-05:00', '2026-08-01T08:00:00-05:00'),

    -- Op 5005: Technician 1 - WO 1005 CANCELED
    (9106, 5005, 'ORG-LIMA-001', 'RES-001',
     NULL, 35.00, 'Y', 1,
     NULL, NULL,
     NULL, NULL, NULL,
     'CANCELED', 'Work order was canceled',
     'N', NULL, NULL,
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '10000000-0000-4000-8000-000000000012', 'User 02',
     '2026-08-04T10:00:00-05:00', '2026-08-04T10:00:00-05:00');

SET IDENTITY_INSERT [dbo].[mnt_operation_human_resource_usages] OFF;
GO
