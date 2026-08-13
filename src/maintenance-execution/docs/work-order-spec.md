# Work Order Module - Gateway

## Base Path

All endpoints in this document are exposed through:

`/api/v1`

The business logic, validations and error codes documented here follow the maintenance-execution microservice contract defined in `cv-cmms-maintenance-execution-ms/docs/work-order-spec.md`, which is the source of truth.

## Create Work Order

### Endpoint

`POST /api/v1/work-orders`

### Headers Required

| Header              | Type   | Required | Description                                     |
| ------------------- | ------ | -------- | ----------------------------------------------- |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)                                    |
| X-Organization-Code | string | Yes      | Target organization code (example: ORG-BOG-001) |

### Request Body

#### Required Fields (Work Order Level)

| Field                 | Type                        | Max Length | Description                                                       |
| --------------------- | --------------------------- | ---------- | ----------------------------------------------------------------- |
| workOrderDescription  | string                      | 240        | Description of the work order.                                    |
| woStatusCode          | string                      | 30         | Status code in UPPER_SNAKE_CASE (example: UNRELEASED).            |
| assetCode             | string                      | 80         | Asset identifier.                                                 |
| workOrderType         | string                      | 30         | Work order type (example: Planned, Not Planned).                  |
| workOrderSubType      | string                      | 30         | Work order sub-type (example: Preventive, Corrective, Emergency). |
| workOrderPriority     | string ("1"\|"2"\|"3"\|"4") | -          | Priority level (1 highest, 4 lowest).                             |
| enableOracleWorkOrder | string ("Y"\|"N")           | 1          | Flag to enable Oracle integration.                                |
| operations            | array                       |            | Operation list. Required: the client SHALL send at least one operation. |

#### Optional Fields (Work Order Level)

| Field                 | Type            | Description                                     |
| --------------------- | --------------- | ----------------------------------------------- |
| workRequestId         | BigInt          | Associated work request identifier (default null). |
| workDefinitionCode    | string (140)    | Work definition code.                           |
| schedulingMethod      | string (30)     | Scheduling method.                              |
| needByDate            | Date (ISO 8601) | Date by which the work order needs to be completed. |
| plannedStartDate      | Date (ISO 8601) | Planned start date.                             |
| plannedCompletionDate | Date (ISO 8601) | Planned completion date.                        |

#### Operation Object Structure

Each operation in the `operations` array SHALL contain:

| Field                      | Type                    | Description                                                                                     |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| operationName              | string (min 2, max 120) | Name of the operation.                                                                          |
| operationDescription       | string (max 240)        | Description of the operation.                                                                   |
| operationSeqNumber         | integer (> 0)           | Sequence number, unique within the Work Order.                                                  |
| createdBy                  | string (UUID)           | User identifier who creates the operation.                                                      |
| operationStatus            | string                  | One of: UNRELEASED, RELEASED, IN_PROCESS, COMPLETED, NOT_DONE, CANCELED, ON_HOLD.               |
| operationType              | string                  | One of: Internal, Supplier.                                                                     |
| operationSubType           | string                  | Must match the parent Work Order's `workOrderSubType` at creation time.                         |
| actualStartDate            | string (ISO 8601)       | Operation start date. Must be before `actualCompletionDate`.                                    |
| actualCompletionDate       | string (ISO 8601)       | Operation completion date. Must be after `actualStartDate`.                                     |
| workOrderOperationResource | array (non-empty)       | Array of resource objects (at least one required).                                              |

Optional fields per operation:

| Field                      | Type   | Description                             |
| -------------------------- | ------ | --------------------------------------- |
| workOrderOperationMaterial | array  | Array of material objects.              |
| unit                       | string | Unit of measure.                        |
| subunit                    | string | Subunit of measure.                     |
| maintainableItem           | string | Maintainable item identifier.           |
| operationCategory          | string | Operation category.                     |

##### Resource Object Structure

Each resource in `workOrderOperationResource` SHALL contain:

| Field                  | Type              | Description                                                                                |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| resourceCode           | string (255)      | Resource identifier.                                                                       |
| resourceSequenceNumber | integer (>= 0)    | Sequence number for grouping resources. Same sequence = work in parallel.                  |
| plannedHours           | number (> 0)      | Planned hours for the resource.                                                            |
| actualHours            | number (> 0)      | Actual hours for the resource.                                                             |
| principalFlag          | string ("Y"\|"N") | Principal flag indicator.                                                                  |

Optional fields per resource:

| Field                 | Type              | Description                             |
| --------------------- | ----------------- | --------------------------------------- |
| hourlyCost            | number            | Hourly cost of the resource.            |
| plannedStartDate      | Date (ISO 8601)   | Planned start date for the resource.    |
| plannedCompletionDate | Date (ISO 8601)   | Planned completion date for resource.   |

##### Material Object Structure (Optional)

Each material in `workOrderOperationMaterial` SHALL contain:

| Field                  | Type         | Description                     |
| ---------------------- | ------------ | ------------------------------- |
| materialSequenceNumber | integer (>=1)| Material sequence number.       |
| quantity               | number (> 0) | Quantity of material.           |
| supplyType             | string       | Supply type code.               |
| materialCode           | string (255) | Material identifier.            |

#### Gateway-Injected Fields

The following fields SHALL NOT be provided by the client. They are injected by the gateway into the NATS payload:

| Field            | Type     | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| actorId          | string   | User ID from JWT payload.                              |
| actorName        | string   | User name from JWT payload.                            |
| organizationCode | string   | Target organization from `X-Organization-Code` header. |
| userPermissions  | string[] | Permissions from the user's role(s) in the organization. |
| userRoles        | string[] | Role codes from the user's assignments in the organization. |

The gateway SHALL validate that the `X-Organization-Code` header is present and that the user has access to that organization before injecting these fields.

### Role Restrictions

Only the following roles are authorized to create Work Orders, restricted by sub-type:

| Role                       | Allowed Sub-Types                             |
| -------------------------- | --------------------------------------------- |
| MANUFACTURING_FACILITATOR  | Emergency                                     |
| TECHNICIAN_MAINTENANCE_01  | Corrective                                    |
| TECHNICIAN_MAINTENANCE_02  | Corrective, Emergency, Inspection             |
| PLANNER_MAINTENANCE_01     | Preventive, Corrective, Emergency, Inspection |
| PLANNER_MAINTENANCE_02     | Preventive, Corrective, Emergency, Inspection |
| COORDINATOR_MAINTENANCE_01 | Preventive, Corrective, Emergency             |
| COORDINATOR_MAINTENANCE_02 | Preventive, Corrective, Emergency             |
| SUPERVISOR_MAINTENANCE_01  | Emergency                                     |
| SUPERVISOR_MAINTENANCE_02  | Emergency                                     |
| ADMIN                      | All (no restrictions)                         |

### Required Permissions

| Permission                      | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `mnt.work.orders.create`        | Required to create a Work Order                        |
| `oracle.mnt.work.orders.create` | Required when `enableOracleWorkOrder = "Y"` and Oracle integration is enabled |

When `enableOracleWorkOrder = "Y"` and the system flag `ENABLE_ORACLE_WORK_ORDER_SYSTEM = "Y"`, the user additionally needs `oracle.mnt.work.orders.create` and an allowed role (MANUFACTURING_FACILITATOR, TECHNICIAN_MAINTENANCE_01/02, PLANNER_MAINTENANCE_01/02, COORDINATOR_MAINTENANCE_01/02, SUPERVISOR_MAINTENANCE_01/02, ADMIN).

### Allowed Type/Subtype Combinations

| workOrderType | workOrderSubType |
| ------------- | ---------------- |
| Planned       | Preventive       |
| Planned       | Corrective       |
| Planned       | Inspection       |
| Planned       | TPM              |
| Not Planned   | Emergency        |

### Gateway Processing

For create, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies that the authenticated user has access to the target organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Injects `actorId`, `actorName`, `organizationCode`, `userPermissions`, and `userRoles` into the NATS payload.
6. Sends `work.order.create` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Create)

```json
{
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe",
  "organizationCode": "ORG-BOG-001",
  "userPermissions": ["mnt.work.orders.create"],
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "enableOracleWorkOrder": "N",
  "workOrderDescription": "Preventive maintenance on hydraulic pump",
  "woStatusCode": "UNRELEASED",
  "assetCode": "AST-001",
  "workOrderType": "Planned",
  "workOrderSubType": "Preventive",
  "workOrderPriority": "2",
  "operations": [
    {
      "operationName": "Lubrication",
      "operationDescription": "Lubrication of all components",
      "operationSeqNumber": 10,
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "operationStatus": "UNRELEASED",
      "operationType": "Internal",
      "operationSubType": "Preventive",
      "actualStartDate": "2026-08-07T08:00:00.000Z",
      "actualCompletionDate": "2026-08-07T10:00:00.000Z",
      "workOrderOperationResource": [
        {
          "principalFlag": "Y",
          "resourceCode": "RES-001",
          "resourceSequenceNumber": 1,
          "plannedHours": 2,
          "actualHours": 2
        }
      ],
      "workOrderOperationMaterial": [
        {
          "materialSequenceNumber": 10,
          "quantity": 1,
          "supplyType": "1",
          "materialCode": "MAT-001"
        }
      ]
    }
  ]
}
```

### Default Operation

The `DEFAULT_OPERATION` fallback is an internal concern of the execution microservice and only applies to non-gateway flows: creating a Work Order from a Work Request injects its own default operation. This gateway requires a non-empty `operations` array on `POST /api/v1/work-orders`, so the default operation is never generated through the public API.

### Response (Create)

`201 Created`

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "workOrderDescription": "Preventive maintenance on hydraulic pump",
    "assetCode": "AST-001",
    "assetShortDescription": "Hydraulic Pump",
    "woStatusCode": "UNRELEASED",
    "woStatusLabel": "Unreleased",
    "workOrderType": "Planned",
    "workOrderSubType": "Preventive",
    "workOrderPriority": "2",
    "workCenterCode": "WC-01",
    "workCenterDescription": "Main Workshop",
    "centerCostCode": 101,
    "workAreaCode": "WA-01",
    "workAreaDescription": "Plant Floor",
    "sector": "Production",
    "subsector": "Line A",
    "organizationCode": "ORG-BOG-001",
    "organizationName": "Bogota Plant",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
    "updatedBy": null,
    "updatedByName": null,
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z",
    "actualStartDate": "2026-08-07T08:00:00.000Z",
    "actualCompletionDate": "2026-08-07T10:00:00.000Z",
    "actualHours": 2,
    "totalManHours": 2,
    "totalSupplierHours": 0,
    "plannedHours": null,
    "workRequestId": null,
    "enableOracleWorkOrder": "N",
    "oclWorkOrderId": null,
    "oclWorkOrderNumber": null,
    "releasedDate": null,
    "closedDate": null,
    "canceledDate": null,
    "canceledReason": null,
    "operations": [
      {
        "operationCode": 5001,
        "operationName": "Lubrication",
        "operationDescription": "Lubrication of all components",
        "operationSeqNumber": 10,
        "assetCode": "AST-001",
        "assetShortDescription": "Hydraulic Pump",
        "operationStatus": "UNRELEASED",
        "operationStatusLabel": "Unreleased",
        "operationType": "Internal",
        "operationSubType": "Preventive",
        "actualStartDate": "2026-08-07T08:00:00.000Z",
        "actualCompletionDate": "2026-08-07T10:00:00.000Z",
        "actualHours": 2,
        "workCenterCode": "WC-01",
        "workCenterDescription": "Main Workshop",
        "workAreaCode": "WA-01",
        "workAreaDescription": "Plant Floor",
        "organizationCode": "ORG-BOG-001",
        "organizationName": "Bogota Plant",
        "createdBy": "550e8400-e29b-41d4-a716-446655440001",
        "createdByName": "John Doe",
        "createdAt": "2026-08-07T15:12:00.000Z",
        "updatedAt": "2026-08-07T15:12:00.000Z",
        "workOrderOperationResource": [
          {
            "id": 9001,
            "resourceCode": "RES-001",
            "resourceSequenceNumber": 1,
            "plannedHours": 2,
            "actualHours": 2,
            "principalFlag": "Y",
            "organizationCode": "ORG-BOG-001",
            "createdBy": "550e8400-e29b-41d4-a716-446655440001",
            "createdByName": "John Doe",
            "createdAt": "2026-08-07T15:12:00.000Z",
            "updatedAt": "2026-08-07T15:12:00.000Z",
            "transactedInOracle": "N",
            "oclWoOperationResourceId": null,
            "syncedToOracleAt": null
          }
        ],
        "workOrderOperationMaterial": [
          {
            "id": 9501,
            "materialCode": "MAT-001",
            "materialName": "Hydraulic Oil",
            "materialSequenceNumber": 10,
            "quantity": 1,
            "supplyType": "1",
            "unitCost": 25.0,
            "totalCost": 25.0,
            "organizationCode": "ORG-BOG-001",
            "createdBy": "550e8400-e29b-41d4-a716-446655440001",
            "createdByName": "John Doe",
            "createdAt": "2026-08-07T15:12:00.000Z",
            "updatedAt": "2026-08-07T15:12:00.000Z",
            "transactedInOracle": "N",
            "oclWoOperationMaterialId": null,
            "syncedToOracleAt": null
          }
        ]
      }
    ]
  }
}
```

## Get Work Orders

### Endpoint

`GET /api/v1/work-orders`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Query Parameters

Dynamic query contract only:

- `filters` (required): JSON string
- `order` (optional): JSON string
- `limit` (optional): non-negative integer
- `offset` (optional): non-negative integer

`filters` format:

```json
[
  { "field": "woStatusCode", "operator": "eq", "value": "RELEASED" },
  { "field": "assetCode", "operator": "like", "value": "AST-" }
]
```

Supported operators:

- `eq`
- `like`
- `gt`
- `lt`
- `in`

Allowed filter fields:

- `workOrderCode`
- `assetCode`
- `workOrderDescription`
- `woStatusCode`
- `workOrderType`
- `workOrderSubType`
- `organizationCode`
- `workCenterCode`
- `workAreaCode`
- `createdAt`
- `actualStartDate`
- `actualCompletionDate`
- `releasedDate`
- `closedDate`
- `canceledDate`

`order` format:

```json
[
  ["createdAt", "DESC"],
  ["workOrderCode", "DESC"]
]
```

If `order` is not provided, the microservice applies the default order `createdAt DESC, workOrderCode DESC`.

### Example Query Payload (Human-Readable JSON)

```json
{
  "filters": [
    { "field": "woStatusCode", "operator": "eq", "value": "RELEASED" },
    { "field": "assetCode", "operator": "like", "value": "AST-" }
  ],
  "order": [["createdAt", "DESC"]],
  "limit": 10,
  "offset": 0
}
```

Note: `filters` and `order` must be sent as serialized JSON strings in query params.

### Gateway Processing

For find all, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Parses `filters` and `order` JSON strings from query parameters.
5. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
6. Sends `work.order.find.all` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Find All)

```json
{
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "userPermissions": ["mnt.work.orders.view"],
  "filters": [
    { "field": "woStatusCode", "operator": "eq", "value": "RELEASED" },
    { "field": "assetCode", "operator": "like", "value": "AST-" }
  ],
  "order": [["createdAt", "DESC"]],
  "limit": 10,
  "offset": 0
}
```

### Response (Find All)

`200 OK` - Returns `workOrders` (array) and `total`:

```json
{
  "workOrders": [
    {
      "workOrderCode": "1001",
      "workOrderDescription": "Preventive maintenance on hydraulic pump",
      "assetCode": "AST-001",
      "assetShortDescription": "Hydraulic Pump",
      "woStatusCode": "UNRELEASED",
      "woStatusLabel": "Unreleased",
      "workOrderType": "Planned",
      "workOrderSubType": "Preventive",
      "workOrderPriority": "2",
      "workCenterCode": "WC-01",
      "workCenterDescription": "Main Workshop",
      "centerCostCode": 101,
      "workAreaCode": "WA-01",
      "workAreaDescription": "Plant Floor",
      "sector": "Production",
      "subsector": "Line A",
      "organizationCode": "ORG-BOG-001",
      "organizationName": "Bogota Plant",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "createdByName": "John Doe",
      "updatedBy": null,
      "updatedByName": null,
      "createdAt": "2026-08-07T15:12:00.000Z",
      "updatedAt": "2026-08-07T15:12:00.000Z",
      "actualStartDate": null,
      "actualCompletionDate": null,
      "actualHours": 0,
      "totalManHours": 0,
      "totalSupplierHours": 0,
      "plannedHours": null,
      "workRequestId": null,
      "enableOracleWorkOrder": "N",
      "oclWorkOrderId": null,
      "oclWorkOrderNumber": null,
      "releasedDate": null,
      "closedDate": null,
      "canceledDate": null,
      "canceledReason": null,
      "operations": []
    }
  ],
  "total": 1
}
```

## Get Work Order By Code

### Endpoint

`GET /api/v1/work-orders/:workOrderCode`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Gateway Processing

For find one, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Sends `work.order.find.one` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Find One)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "userPermissions": ["mnt.work.orders.view"]
}
```

### Response (Find One)

`200 OK` - Returns the Work Order wrapped in `workOrder` including all nested operations, resources, and materials.

## Update Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Request Body

`enableOracleWorkOrder` is required. All other fields are optional (partial update):

| Field                 | Type                        | Max Length | Description                                                       |
| --------------------- | --------------------------- | ---------- | ----------------------------------------------------------------- |
| enableOracleWorkOrder | string ("Y"\|"N")           | 1          | Flag to enable Oracle integration for this update (required).     |
| workOrderDescription  | string                      | 240        | Updated description of the work order.                            |
| workOrderType         | string                      | 30         | Updated work order type.                                          |
| workOrderSubType      | string                      | 30         | Updated work order sub-type.                                      |
| workOrderPriority     | string ("1"\|"2"\|"3"\|"4") | -          | Updated priority level.                                           |

### Required Permissions

| Permission                      | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `mnt.work.orders.update`        | Required to update a Work Order                        |
| `oracle.mnt.work.orders.update` | Required when `enableOracleWorkOrder = "Y"` and Oracle integration is enabled |

### Gateway Processing

For update, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userPermissions`, `userRoles`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.order.update` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Update)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userPermissions": ["mnt.work.orders.update"],
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe",
  "enableOracleWorkOrder": "N",
  "workOrderDescription": "Updated description"
}
```

### Response (Update)

`200 OK` - Returns the updated Work Order wrapped in `workOrder` with all nested data (same structure as `work.order.find.one` response).

## Release Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode/release`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Purpose

Transitions a Work Order from `UNRELEASED` or `ON_HOLD` to `RELEASED` status. Sets `releasedDate` to the current timestamp and sets all operations' `operationStatus` to `RELEASED`.

### Gateway Processing

For release, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userRoles`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.order.release` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Release)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Release)

`200 OK` - Returns the updated Work Order with `woStatusCode: "RELEASED"` and `releasedDate` set.

## Hold On Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode/hold`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Purpose

Transitions a Work Order from `UNRELEASED` or `RELEASED` to `ON_HOLD` status.

### Gateway Processing

For hold, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userRoles`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.order.hold` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Hold)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Hold)

`200 OK` - Returns the updated Work Order with `woStatusCode: "ON_HOLD"`.

## Complete Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode/complete`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Purpose

Transitions a Work Order from `RELEASED` to `COMPLETED` status. Sets all operations' `operationStatus` to `COMPLETED`.

### Gateway Processing

For complete, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userRoles`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.order.complete` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Complete)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Complete)

`200 OK` - Returns the updated Work Order with `woStatusCode: "COMPLETED"`.

## Close Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode/close`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Purpose

Transitions a Work Order from `COMPLETED` to `CLOSED` status (terminal state). Sets `closedDate` to the current timestamp.

### Gateway Processing

For close, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userRoles`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.order.close` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Close)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Close)

`200 OK` - Returns the updated Work Order with `woStatusCode: "CLOSED"` and `closedDate` set.

## Cancel Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode/cancel`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Request Body

| Field          | Type   | Required | Max Length | Description                 |
| -------------- | ------ | -------- | ---------- | --------------------------- |
| canceledReason | string | Yes      | 240        | Reason for cancellation.    |

### Purpose

Cancels a Work Order and all its operations (terminal state). Sets `woStatusCode` to `CANCELED`, `canceledDate` and `canceledReason`, and all operations' `operationStatus` to `CANCELED`.

### Required Permissions

| Permission                        | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `mnt.work.orders.cancel`          | Required to cancel a Work Order                        |
| `oracle.mnt.work.orders.cancel`   | Required when Oracle integration is enabled and the WO was synced to Oracle |

### Gateway Processing

For cancel, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userPermissions`, `userRoles`, `actorId`, `actorName`, and `canceledReason` into the NATS payload.
6. Sends `work.order.cancel` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Cancel)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userPermissions": ["mnt.work.orders.cancel"],
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe",
  "canceledReason": "No replacement parts available"
}
```

### Response (Cancel)

`200 OK` - Returns the updated Work Order with `woStatusCode: "CANCELED"`, `canceledDate`, `canceledReason`, and all operations with `operationStatus: "CANCELED"`.

## Pending Approval Work Order

### Endpoint

`PATCH /api/v1/work-orders/:workOrderCode/pending-approval`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`: numeric identifier of the Work Order.

### Purpose

Transitions a Work Order from `PENDING_APPROVAL` to `UNRELEASED` status.

### Gateway Processing

For pending approval, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Injects `workOrderCode`, `organizationCode`, `userRoles`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.order.pending-approval` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Pending Approval)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Pending Approval)

`200 OK` - Returns the updated Work Order with `woStatusCode: "UNRELEASED"`.

## Status Transition Reference

### Work Order Status Transitions

| From Status      | Allowed Transitions To       |
| ---------------- | ---------------------------- |
| UNRELEASED       | ON_HOLD, RELEASED, CANCELED  |
| RELEASED         | COMPLETED, ON_HOLD, CANCELED |
| ON_HOLD          | RELEASED, CANCELED           |
| COMPLETED        | CLOSED, RELEASED             |
| CLOSED           | [] (terminal)                |
| CANCELED         | [] (terminal)                |
| PENDING_APPROVAL | UNRELEASED                   |

### Work Order Status / Operation Status Compatibility

| woStatusCode     | Allowed operationStatus values  |
| ---------------- | ------------------------------- |
| UNRELEASED       | UNRELEASED                      |
| RELEASED         | RELEASED, COMPLETED, IN_PROCESS |
| ON_HOLD          | ON_HOLD                         |
| PENDING_APPROVAL | UNRELEASED                      |
| COMPLETED        | COMPLETED, NOT_DONE             |
| CLOSED           | COMPLETED, NOT_DONE             |
| CANCELED         | CANCELED                        |

## Error Mapping

| Status | Error Code / Message                                          | Description                                                    |
| ------ | ------------------------------------------------------------- | -------------------------------------------------------------- |
| 400    | X-Organization-Code header is required                        | Missing org header in gateway                                  |
| 400    | User does not have access to organization                     | User-org mismatch in authenticated context                     |
| 400    | Validation errors                                             | Missing or invalid fields                                      |
| 400    | Invalid filter data                                           | Invalid `filters`, `order`, `limit`, or `offset`               |
| 400    | organizationCode is required                                  | Missing organization context in microservice payload           |
| 400    | userRoles must be a non-empty array                           | Missing role context in microservice payload                   |
| 400    | Invalid combination of workOrderType and workOrderSubType     | Disallowed type/subtype combination                            |
| 400    | woStatusCode must be a valid UPPER_SNAKE_CASE status          | Invalid status code                                            |
| 400    | Invalid workOrderPriority                                     | Priority not one of "1", "2", "3", "4"                         |
| 400    | Cannot release/complete/close/cancel work order from ...      | Invalid status transition                                      |
| 400    | canceledReason is required / must not exceed 240 characters   | Cancel reason missing or too long                              |
| 403    | MISSING_PERMISSION                                            | User lacks required permission (`mnt.work.orders.view/create/update/cancel`) |
| 403    | MISSING_ORACLE_PERMISSION                                     | Missing Oracle permission or role when Oracle is enabled        |
| 403    | SUBTYPE_NOT_ALLOWED_FOR_ROLE                                  | User's role cannot access the requested subtype                |
| 403    | ORGANIZATION_MISMATCH                                         | Record belongs to a different organization                      |
| 404    | Work order not found                                          | The requested work order does not exist                         |
| 500    | Internal server error                                         | Unexpected failure                                              |

## Pending Gaps / Future Work

The contract above defines the target behavior and the gateway currently implements all endpoints, including the injection of `userPermissions` in the `find.one`, `find.all`, `create`, `update`, and `cancel` payloads. Read access is enforced by the microservice through the `mnt.work.orders.view` permission (the only read restriction for Work Orders).