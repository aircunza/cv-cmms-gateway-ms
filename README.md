# cv-cmms-gateway-ms

Gateway for the CMMS maintenance execution microservice.

## Work Orders Frontend Contract

Base URL:

`/api/v1`

Headers required for all Work Order endpoints:

- `Authorization: Bearer <token>`
- `X-Organization-Code: <organization-code>`

## Create Work Order

Endpoint:

`POST /api/v1/work-orders`

Request body example:

```json
{
  "workOrderDescription": "Preventive maintenance on hydraulic pump",
  "woStatusCode": "UNRELEASED",
  "assetCode": "AST-001",
  "workOrderType": "Planned",
  "workOrderSubType": "Preventive",
  "workOrderPriority": "2",
  "enableOracleWorkOrder": "N",
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
      "workOrderOperationMaterial": []
    }
  ]
}
```

## Get Work Orders

Endpoint:

`GET /api/v1/work-orders`

Query parameters:

- `filters`: JSON string (required)
- `order`: JSON string (optional)
- `limit`: non-negative integer (optional)
- `offset`: non-negative integer (optional)

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

Example query payload (human-readable JSON):

```json
{
  "filters": [
    { "field": "organizationCode", "operator": "eq", "value": "ORG-BOG-001" },
    { "field": "workOrderSubType", "operator": "eq", "value": "Preventive" }
  ],
  "order": [["createdAt", "DESC"]],
  "limit": 10,
  "offset": 0
}
```

Note: `filters` and `order` must be sent as serialized JSON strings in query params.

Response example:

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
          "operationCode": "5001",
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
              "id": "9001",
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
              "id": "9501",
              "materialCode": "MAT-001",
              "materialName": null,
              "materialSequenceNumber": 10,
              "quantity": 1,
              "supplyType": "1",
              "unitCost": null,
              "totalCost": null,
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
  ],
  "total": 1
}
```

## Get Work Order By Code

Endpoint:

`GET /api/v1/work-orders/:workOrderCode`

Response example:

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
        "operationCode": "5001",
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
            "id": "9001",
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
            "id": "9501",
            "materialCode": "MAT-001",
            "materialName": null,
            "materialSequenceNumber": 10,
            "quantity": 1,
            "supplyType": "1",
            "unitCost": null,
            "totalCost": null,
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

## Other Work Order Endpoints

| Method | Path                                        | Description         |
| ------ | ------------------------------------------- | ------------------- |
| PATCH  | /api/v1/work-orders/:workOrderCode          | Update work order   |
| PATCH  | /api/v1/work-orders/:workOrderCode/release  | Release work order  |
| PATCH  | /api/v1/work-orders/:workOrderCode/complete | Complete work order |
| PATCH  | /api/v1/work-orders/:workOrderCode/close    | Close work order    |
| PATCH  | /api/v1/work-orders/:workOrderCode/cancel   | Cancel work order   |

## Work Requests Frontend Contract

Base URL:

`/api/v1`

Headers required for all Work Request endpoints:

- `Authorization: Bearer <token>`
- `X-Organization-Code: <organization-code>`

### Create Work Request

Endpoint:

`POST /api/v1/work-requests`

Request body example:

```json
{
  "assetCode": "AST-001",
  "assetShortDescription": "Hydraulic Pump",
  "issueDescription": "Oil leak detected on the hydraulic pump.",
  "enableOracleWorkOrder": "N"
}
```

Fields:

| Field                 | Type          | Required | Max Length | Description                          |
| --------------------- | ------------- | -------- | ---------- | ------------------------------------ |
| assetCode             | string        | Yes      | 80         | Asset identifier.                    |
| issueDescription      | string        | Yes      | 240        | Description of the reported issue.   |
| enableOracleWorkOrder | string        | Yes      | 1          | Enable Oracle integration (`"Y"`/`"N"`). |
| assetShortDescription | string        | No       | 200        | Asset short description.             |

Role restriction: only **MANUFACTURING_FACILITATOR** is authorized to create Work Requests.

Required permissions: `mnt.work.request.create`, `mnt.work.orders.create`. When `enableOracleWorkOrder = "Y"` and Oracle integration is enabled, also requires `oracle.mnt.work.orders.create`.

Creating a Work Request automatically creates an associated Work Order with fixed values (`workOrderDescription` same as `issueDescription`, type `"Not Planned"`, subtype `"Emergency"`, priority `"1"`, status `RELEASED`).

Response `201 Created`:

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

### Get Work Requests

Endpoint:

`GET /api/v1/work-requests`

Query parameters:

- `filters`: JSON string (required)
- `order`: JSON string (optional)
- `limit`: non-negative integer (optional)
- `offset`: non-negative integer (optional)

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

Example query payload (human-readable JSON):

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

Note: `filters` and `order` must be sent as serialized JSON strings in query params. If `order` is not provided, the default is `createdAt DESC, requestId DESC`.

Response example:

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

### Get Work Request By ID

Endpoint:

`GET /api/v1/work-requests/:requestId`

Path parameter:

- `requestId`: numeric identifier of the Work Request.

Response example:

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

### Update Work Request Description

Endpoint:

`PATCH /api/v1/work-requests/:requestId`

Path parameter:

- `requestId`: numeric identifier of the Work Request.

Request body example:

```json
{
  "issueDescription": "Oil leak detected on the hydraulic pump - updated."
}
```

Field:

| Field            | Type   | Required | Max Length | Description                       |
| ---------------- | ------ | -------- | ---------- | --------------------------------- |
| issueDescription | string | No       | 240        | Updated description of the issue. |

Required permission: `mnt.work.request.update`.

Response: returns the updated Work Request (same shape as Get By ID).

### Complete Work Request

Endpoint:

`PATCH /api/v1/work-requests/:requestId/complete`

Path parameter:

- `requestId`: numeric identifier of the Work Request.

Purpose: transitions a Work Request from `RELEASED` to `COMPLETED`. This action does **not** affect the associated Work Order.

Required permission: `mnt.work.request.complete`.

Authorized roles: `MANUFACTURING_FACILITATOR`, `TECHNICIAN_MAINTENANCE_01`, `TECHNICIAN_MAINTENANCE_02`, `PLANNER_MAINTENANCE_01`, `PLANNER_MAINTENANCE_02`, `COORDINATOR_MAINTENANCE_01`, `COORDINATOR_MAINTENANCE_02`, `SUPERVISOR_MAINTENANCE_01`, `SUPERVISOR_MAINTENANCE_02`, `ADMIN`.

Response: returns the Work Request with `statusCode: "COMPLETED"` and `completedAt` set.

### Cancel Work Request

Endpoint:

`PATCH /api/v1/work-requests/:requestId/cancel`

Path parameter:

- `requestId`: numeric identifier of the Work Request.

Purpose: cancels a Work Request and its associated Work Order. If Oracle integration is enabled and the Work Order was created in Oracle, it also cancels the Work Order in Oracle Fusion.

Required permissions: `mnt.work.request.cancel`, `mnt.work.orders.cancel`. When Oracle integration is enabled and the WO was synced to Oracle, also requires `oracle.mnt.work.orders.cancel`.

Role restriction: only **MANUFACTURING_FACILITATOR** is authorized to cancel Work Requests.

Response: returns the Work Request with `statusCode: "CANCELED"` and `canceledAt` set.

### Status Transitions

| From Status | Allowed Transitions To        |
| ----------- | ------------------------------ |
| RELEASED    | COMPLETED, CANCELED            |
| COMPLETED   | CANCELED                       |
| CANCELED    | None (terminal)                |

Impact on the associated Work Order:

| Work Request Transition | Work Order Impact                                                        |
| ----------------------- | ------------------------------------------------------------------------ |
| RELEASED → COMPLETED    | None                                                                     |
| RELEASED → CANCELED     | WO canceled, all operations canceled, Oracle sync if applicable          |
| COMPLETED → CANCELED    | WO canceled, all operations canceled, Oracle sync if applicable          |

### Errors

| Status | Message                                   | Description                                          |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| 400    | X-Organization-Code header is required    | Missing org header                                   |
| 400    | User does not have access to organization | User-org mismatch                                   |
| 400    | Validation errors                         | Missing or invalid fields                           |
| 400    | Invalid filter data                       | Invalid `filters`, `order`, `limit`, or `offset`     |
| 400    | Invalid status transition                 | Work Request cannot transition from current status   |
| 403    | MISSING_PERMISSION                        | User lacks required permission                       |
| 403    | MISSING_ORACLE_PERMISSION                 | Missing Oracle permission when Oracle integration is enabled |
| 403    | ROLE_NOT_AUTHORIZED                       | User's role is not authorized for this action        |
| 403    | ORGANIZATION_MISMATCH                     | Asset belongs to a different organization            |
| 404    | Asset not found or inactive               | The specified asset does not exist or is inactive    |
| 404    | Work request not found                    | The specified Work Request does not exist            |
