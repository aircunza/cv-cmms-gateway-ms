# Work Request Module - Gateway

## Base Path

All endpoints in this document are exposed through:

`/api/v1`

The business logic, validations and error codes documented here follow the maintenance-execution microservice contract defined in `cv-cmms-maintenance-execution-ms/docs/work-request-spec.md`, which is the source of truth.

## Create Work Request

### Endpoint

`POST /api/v1/work-requests`

### Headers Required

| Header              | Type   | Required | Description                                     |
| ------------------- | ------ | -------- | ----------------------------------------------- |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)                                    |
| X-Organization-Code | string | Yes      | Target organization code (example: ORG-BOG-001) |

### Request Body

#### Required Fields

| Field                 | Type              | Max Length | Description                                  |
| --------------------- | ----------------- | ---------- | -------------------------------------------- |
| assetCode             | string            | 80         | Asset identifier.                            |
| issueDescription      | string            | 240        | Description of the reported issue.           |
| enableOracleWorkOrder | string ("Y"\|"N") | 1          | Flag to enable Oracle integration.           |

#### Optional Fields

| Field                 | Type   | Max Length | Description                        |
| --------------------- | ------ | ---------- | ---------------------------------- |
| assetShortDescription | string | 200        | Asset short description.           |

#### System Generated Fields

The following fields SHALL NOT be provided by the client. They are generated or injected by the system/gateway:

| Field                 | Type    | Description                                            |
| --------------------- | ------- | ------------------------------------------------------ |
| requestId             | BigInt  | Auto-generated identifier.                             |
| statusCode            | string  | Initial work request status set by system as RELEASED. |
| requestedAt           | Date    | Creation timestamp.                                    |
| releasedAt            | Date    | Release timestamp.                                     |
| completedAt           | Date    | Completion timestamp.                                  |
| canceledAt            | Date    | Cancellation timestamp.                                |
| createdAt / updatedAt | Date    | Record timestamps.                                     |
| workCenterCode        | string  | Work center code (inherited from asset).               |
| centerCostCode        | integer | Cost center code (inherited from asset).               |
| workAreaCode          | string  | Work area code (inherited from asset).                 |
| sector / subsector    | string  | Sector values (inherited from asset).                  |
| organizationCode      | string  | Organization code.                                     |
| organizationName      | string  | Organization name.                                     |

### Role Restriction

Only the **MANUFACTURING_FACILITATOR** role is authorized to create Work Requests.

### Required Permissions

| Permission                        | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `mnt.work.request.create`         | Required to create a Work Request                      |
| `mnt.work.orders.create`          | Required to create the associated Work Order           |
| `oracle.mnt.work.orders.create`   | Required when `enableOracleWorkOrder = "Y"` and Oracle integration is enabled |

### Gateway Processing

For create, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies that the authenticated user has access to the target organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Injects `actorId`, `actorName`, `organizationCode`, `userPermissions`, and `userRoles` into the NATS payload.
6. Sends `work.request.create` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Create)

```json
{
  "assetCode": "AST-001",
  "assetShortDescription": "Hydraulic Pump",
  "issueDescription": "Oil leak detected on the hydraulic pump.",
  "enableOracleWorkOrder": "N",
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe",
  "organizationCode": "ORG-BOG-001",
  "userPermissions": [
    "mnt.work.request.create",
    "mnt.work.orders.create"
  ],
  "userRoles": ["MANUFACTURING_FACILITATOR"]
}
```

### Associated Work Order

When a Work Request is created, the microservice automatically creates an associated Work Order with the following fixed values:

| Field                 | Value                                          |
| --------------------- | ---------------------------------------------- |
| workOrderDescription  | Same as `issueDescription` from the Work Request |
| workOrderType         | `"Not Planned"`                                |
| workOrderSubType      | `"Emergency"`                                  |
| workOrderPriority     | `"1"`                                          |
| woStatusCode          | `"RELEASED"`                                   |
| enableOracleWorkOrder | Same as the Work Request                       |
| operations            | Single default operation with one resource     |

### Response (Create)

`201 Created`

```json
{
  "workRequest": {
    "requestId": "900000001",
    "assetCode": "AST-001",
    "assetShortDescription": "Hydraulic Pump",
    "issueDescription": "Oil leak detected on the hydraulic pump.",
    "statusCode": "RELEASED",
    "statusLabel": "Released",
    "requestedAt": "2026-08-07T15:12:00.000Z",
    "completedAt": null,
    "releasedAt": "2026-08-07T15:12:00.000Z",
    "canceledAt": null,
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
    "workOrders": [
      {
        "workOrderCode": "1001",
        "workOrderDescription": "Oil leak detected on the hydraulic pump.",
        "workOrderType": "Not Planned",
        "workOrderSubType": "Emergency",
        "workOrderPriority": "1",
        "woStatusCode": "RELEASED"
      }
    ]
  },
  "workOrder": {
    "workOrderCode": "1001",
    "workOrderDescription": "Oil leak detected on the hydraulic pump.",
    "woStatusCode": "RELEASED",
    "woStatusLabel": "Released",
    "workOrderType": "Not Planned",
    "workOrderSubType": "Emergency",
    "workOrderPriority": "1",
    "organizationCode": "ORG-BOG-001",
    "enableOracleWorkOrder": "N",
    "operations": []
  }
}
```

## Get Work Requests

### Endpoint

`GET /api/v1/work-requests`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Query Parameters

No legacy query contract is supported. Use only dynamic query parameters:

- `filters` (required): JSON string
- `order` (optional): JSON string
- `limit` (optional): non-negative integer
- `offset` (optional): non-negative integer

`filters` format:

```json
[
  { "field": "statusCode", "operator": "eq", "value": "RELEASED" },
  { "field": "assetCode", "operator": "eq", "value": "AST-001" }
]
```

Supported operators:

- `eq`
- `like`
- `gt`
- `lt`
- `in`

Allowed filter fields:

- `requestId`
- `assetCode`
- `issueDescription`
- `statusCode`
- `organizationCode`
- `workAreaCode`
- `createdAt`
- `requestedAt`
- `releasedAt`
- `completedAt`
- `canceledAt`

`order` format:

```json
[
  ["createdAt", "DESC"],
  ["requestId", "DESC"]
]
```

If `order` is not provided, the microservice applies the default order `createdAt DESC, requestId DESC`.

### Example Query Payload (Human-Readable JSON)

```json
{
  "filters": [
    { "field": "organizationCode", "operator": "eq", "value": "ORG-BOG-001" },
    { "field": "statusCode", "operator": "eq", "value": "RELEASED" }
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
5. Extracts `userRoles` from the authenticated organization context.
6. Sends `work.request.find.all` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Find All)

```json
{
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["MANUFACTURING_FACILITATOR"],
  "filters": [
    { "field": "organizationCode", "operator": "eq", "value": "ORG-BOG-001" },
    { "field": "statusCode", "operator": "eq", "value": "RELEASED" }
  ],
  "order": [["createdAt", "DESC"]],
  "limit": 10,
  "offset": 0
}
```

### Response (Find All)

```json
{
  "workRequests": [
    {
      "requestId": "900000001",
      "assetCode": "AST-001",
      "assetShortDescription": "Hydraulic Pump",
      "issueDescription": "Oil leak detected on the hydraulic pump.",
      "statusCode": "RELEASED",
      "statusLabel": "Released",
      "requestedAt": "2026-08-07T15:12:00.000Z",
      "completedAt": null,
      "releasedAt": "2026-08-07T15:12:00.000Z",
      "canceledAt": null,
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
      "workOrders": [
        {
          "workOrderCode": "1001",
          "workOrderDescription": "Oil leak detected on the hydraulic pump.",
          "workOrderType": "Not Planned",
          "workOrderSubType": "Emergency",
          "workOrderPriority": "1",
          "woStatusCode": "RELEASED"
        }
      ]
    }
  ],
  "total": 1
}
```

## Get Work Request By ID

### Endpoint

`GET /api/v1/work-requests/:requestId`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `requestId`: numeric identifier of the Work Request.

### Gateway Processing

For find one, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Sends `work.request.find.one` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Find One)

```json
{
  "requestId": "900000001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["MANUFACTURING_FACILITATOR"]
}
```

### Response (Find One)

```json
{
  "workRequest": {
    "requestId": "900000001",
    "assetCode": "AST-001",
    "assetShortDescription": "Hydraulic Pump",
    "issueDescription": "Oil leak detected on the hydraulic pump.",
    "statusCode": "RELEASED",
    "statusLabel": "Released",
    "requestedAt": "2026-08-07T15:12:00.000Z",
    "completedAt": null,
    "releasedAt": "2026-08-07T15:12:00.000Z",
    "canceledAt": null,
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
    "workOrders": [
      {
        "workOrderCode": "1001",
        "workOrderDescription": "Oil leak detected on the hydraulic pump.",
        "workOrderType": "Not Planned",
        "workOrderSubType": "Emergency",
        "workOrderPriority": "1",
        "woStatusCode": "RELEASED"
      }
    ]
  }
}
```

## Update Work Request Description

### Endpoint

`PATCH /api/v1/work-requests/:requestId`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `requestId`: numeric identifier of the Work Request.

### Request Body

#### Editable Fields

| Field            | Type   | Max Length | Description                       |
| ---------------- | ------ | ---------- | --------------------------------- |
| issueDescription | string | 240        | Updated description of the issue. |

### Required Permissions

| Permission                  | Description                                  |
| --------------------------- | -------------------------------------------- |
| `mnt.work.request.update`   | Required to update a Work Request description |

### Gateway Processing

For update, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userPermissions` from the authenticated organization context.
5. Injects `requestId`, `userPermissions`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.request.update` to the maintenance-execution microservice.

> Note: the update contract does not require `organizationCode` or `userRoles`; only `userPermissions` is validated by the microservice.

### NATS Payload Sent to Microservice (Update)

```json
{
  "requestId": "900000001",
  "issueDescription": "Oil leak detected on the hydraulic pump - updated.",
  "userPermissions": ["mnt.work.request.update"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Update)

Returns the updated Work Request:

```json
{
  "workRequest": {
    "requestId": "900000001",
    "assetCode": "AST-001",
    "assetShortDescription": "Hydraulic Pump",
    "issueDescription": "Oil leak detected on the hydraulic pump - updated.",
    "statusCode": "RELEASED",
    "statusLabel": "Released",
    "requestedAt": "2026-08-07T15:12:00.000Z",
    "completedAt": null,
    "releasedAt": "2026-08-07T15:12:00.000Z",
    "canceledAt": null,
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
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedByName": "John Doe",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T16:30:00.000Z",
    "workOrders": [
      {
        "workOrderCode": "1001",
        "workOrderDescription": "Oil leak detected on the hydraulic pump.",
        "workOrderType": "Not Planned",
        "workOrderSubType": "Emergency",
        "workOrderPriority": "1",
        "woStatusCode": "RELEASED"
      }
    ]
  }
}
```

## Complete Work Request

### Endpoint

`PATCH /api/v1/work-requests/:requestId/complete`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `requestId`: numeric identifier of the Work Request.

### Purpose

Transitions a Work Request from `RELEASED` to `COMPLETED` status. This action does NOT affect the associated Work Order.

### Required Permissions

| Permission                    | Description                              |
| ----------------------------- | ---------------------------------------- |
| `mnt.work.request.complete`   | Required to complete a Work Request      |

### Role Restriction

The following roles are authorized to complete a Work Request:

| Role |
|------|
| MANUFACTURING_FACILITATOR |
| TECHNICIAN_MAINTENANCE_01 |
| TECHNICIAN_MAINTENANCE_02 |
| PLANNER_MAINTENANCE_01 |
| PLANNER_MAINTENANCE_02 |
| COORDINATOR_MAINTENANCE_01 |
| COORDINATOR_MAINTENANCE_02 |
| SUPERVISOR_MAINTENANCE_01 |
| SUPERVISOR_MAINTENANCE_02 |
| ADMIN |

### Gateway Processing

For complete, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Injects `requestId`, `organizationCode`, `userRoles`, `userPermissions`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.request.complete` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Complete)

```json
{
  "requestId": "900000001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["MANUFACTURING_FACILITATOR"],
  "userPermissions": ["mnt.work.request.complete"],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Complete)

Returns the updated Work Request with `statusCode: "COMPLETED"` and `completedAt` set:

```json
{
  "workRequest": {
    "requestId": "900000001",
    "assetCode": "AST-001",
    "assetShortDescription": "Hydraulic Pump",
    "issueDescription": "Oil leak detected on the hydraulic pump.",
    "statusCode": "COMPLETED",
    "statusLabel": "Completed",
    "requestedAt": "2026-08-07T15:12:00.000Z",
    "completedAt": "2026-08-07T18:00:00.000Z",
    "releasedAt": "2026-08-07T15:12:00.000Z",
    "canceledAt": null,
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
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedByName": "John Doe",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T18:00:00.000Z",
    "workOrders": [
      {
        "workOrderCode": "1001",
        "workOrderDescription": "Oil leak detected on the hydraulic pump.",
        "workOrderType": "Not Planned",
        "workOrderSubType": "Emergency",
        "workOrderPriority": "1",
        "woStatusCode": "RELEASED"
      }
    ]
  }
}
```

## Cancel Work Request

### Endpoint

`PATCH /api/v1/work-requests/:requestId/cancel`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Cookie             | string | Yes      | Authentication token (auth_token=&lt;jwt&gt;)             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `requestId`: numeric identifier of the Work Request.

### Purpose

Cancels a Work Request and its associated Work Order. If Oracle integration is enabled and the Work Order was created in Oracle, it also cancels the Work Order in Oracle Fusion.

### Required Permissions

| Permission                        | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `mnt.work.request.cancel`         | Required to cancel a Work Request                      |
| `mnt.work.orders.cancel`          | Required to cancel the associated Work Order           |
| `oracle.mnt.work.orders.cancel`   | Required when Oracle integration is enabled and the WO was synced to Oracle |

### Role Restriction

Only the **MANUFACTURING_FACILITATOR** role is authorized to cancel Work Requests.

### Gateway Processing

For cancel, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userPermissions` and `userRoles` from the authenticated organization context.
5. Injects `requestId`, `organizationCode`, `userRoles`, `userPermissions`, `actorId`, and `actorName` into the NATS payload.
6. Sends `work.request.cancel` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Cancel)

```json
{
  "requestId": "900000001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["MANUFACTURING_FACILITATOR"],
  "userPermissions": [
    "mnt.work.request.cancel",
    "mnt.work.orders.cancel"
  ],
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe"
}
```

### Response (Cancel)

Returns the canceled Work Request with `statusCode: "CANCELED"` and `canceledAt` set:

```json
{
  "workRequest": {
    "requestId": "900000001",
    "assetCode": "AST-001",
    "assetShortDescription": "Hydraulic Pump",
    "issueDescription": "Oil leak detected on the hydraulic pump.",
    "statusCode": "CANCELED",
    "statusLabel": "Canceled",
    "requestedAt": "2026-08-07T15:12:00.000Z",
    "completedAt": null,
    "releasedAt": "2026-08-07T15:12:00.000Z",
    "canceledAt": "2026-08-07T19:00:00.000Z",
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
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedByName": "John Doe",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T19:00:00.000Z",
    "workOrders": [
      {
        "workOrderCode": "1001",
        "workOrderDescription": "Oil leak detected on the hydraulic pump.",
        "workOrderType": "Not Planned",
        "workOrderSubType": "Emergency",
        "workOrderPriority": "1",
        "woStatusCode": "CANCELED"
      }
    ]
  }
}
```

## Status Transition Reference

### Work Request Status Transitions

| From Status | Allowed Transitions To |
|-------------|----------------------|
| RELEASED    | COMPLETED, CANCELED  |
| COMPLETED   | CANCELED             |
| CANCELED    | [] (terminal)        |

### Work Request Status / Work Order Impact

| Work Request Transition | Work Order Impact |
|------------------------|-------------------|
| RELEASED → COMPLETED   | None              |
| RELEASED → CANCELED    | WO canceled, all operations canceled, Oracle sync if applicable |
| COMPLETED → CANCELED   | WO canceled, all operations canceled, Oracle sync if applicable |

## Error Mapping

| Status | Error Code / Message                          | Description                                          |
| ------ | --------------------------------------------- | ---------------------------------------------------- |
| 400    | X-Organization-Code header is required        | Missing org header in gateway                        |
| 400    | User does not have access to organization     | User-org mismatch in authenticated context           |
| 400    | Validation errors                             | Missing or invalid fields                            |
| 400    | Invalid filter data                           | Invalid `filters`, `order`, `limit`, or `offset`     |
| 400    | organizationCode is required                  | Missing organization context in microservice payload |
| 400    | userRoles must be a non-empty array           | Missing role context in microservice payload         |
| 400    | Invalid status transition                     | Work Request cannot transition from current status   |
| 403    | MISSING_PERMISSION                            | User lacks required permission                       |
| 403    | MISSING_ORACLE_PERMISSION                     | User lacks Oracle permission when Oracle integration is enabled |
| 403    | ROLE_NOT_AUTHORIZED                           | User's role is not authorized for this action        |
| 403    | ORGANIZATION_MISMATCH                         | Asset belongs to a different organization            |
| 404    | Asset not found or inactive                   | The specified asset does not exist or is inactive    |
| 404    | Work request not found                        | The specified Work Request does not exist            |
| 500    | Internal server error                         | Unexpected failure                                   |

## Pending Gaps / Future Work

The contract above defines the target behavior. The following gaps currently exist in the gateway and require implementation to fully match the maintenance-execution microservice:

- **Complete endpoint missing**: `PATCH /api/v1/work-requests/:requestId/complete` is not implemented in the gateway controller.
- **Organization context injection**: `create`, `find.one`, `find.all`, `update`, and `cancel` do not inject the organization/injected fields (`organizationCode`, `userPermissions`, `userRoles`) required by the microservice payloads.
- **Organization access validation**: no endpoint validates `X-Organization-Code` access (`validateOrgAccess`) as the work-orders module does.
- **Find all query contract**: `find.all` currently exposes legacy query parameters (`assetCode`, `organizationCode`, `statusCode`, `workAreaCode`) instead of the dynamic `filters` / `order` / `limit` / `offset` contract.
- **Cancel payload**: `cancel` must inject `organizationCode`, `userRoles`, and `userPermissions` so that `mnt.work.orders.cancel` validation can be enforced by the microservice.
- **Oracle authorization**: Oracle-specific permissions are validated by the microservice; gateway only propagates `userPermissions`/`userRoles` unchanged.