# Work Order Module - Gateway

## Base Path

All endpoints in this document are exposed through:

`/api/v1`

## Create Work Order

### Endpoint

`POST /api/v1/work-orders`

### Headers Required

| Header              | Type   | Required | Description                                     |
| ------------------- | ------ | -------- | ----------------------------------------------- |
| Authorization       | string | Yes      | Bearer token                                    |
| X-Organization-Code | string | Yes      | Target organization code (example: ORG-BOG-001) |

### Request Body

#### Required Fields

| Field                 | Type                        | Max Length | Description                                                       |
| --------------------- | --------------------------- | ---------- | ----------------------------------------------------------------- |
| workOrderDescription  | string                      | 240        | Description of the work order.                                    |
| woStatusCode          | string                      | 30         | Status code in UPPER_SNAKE_CASE (example: UNRELEASED).            |
| assetCode             | string                      | 80         | Asset identifier.                                                 |
| workOrderType         | string                      | 30         | Work order type (example: Planned, Not Planned).                  |
| workOrderSubType      | string                      | 30         | Work order sub-type (example: Preventive, Corrective, Emergency). |
| workOrderPriority     | string ("1"\|"2"\|"3"\|"4") | -          | Priority level (1 highest, 4 lowest).                             |
| enableOracleWorkOrder | string ("Y"\|"N")           | 1          | Flag to enable Oracle integration.                                |

#### Optional Fields

| Field                 | Type            | Description                                                          |
| --------------------- | --------------- | -------------------------------------------------------------------- |
| workRequestId         | number          | Associated work request identifier.                                  |
| workDefinitionCode    | string          | Work definition code.                                                |
| schedulingMethod      | string          | Scheduling method.                                                   |
| needByDate            | Date (ISO 8601) | Date by which the work order needs to be completed.                  |
| plannedStartDate      | Date (ISO 8601) | Planned start date.                                                  |
| plannedCompletionDate | Date (ISO 8601) | Planned completion date.                                             |
| operations            | array           | Operation list. If missing or empty, a default operation is created. |

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
  "userPermissions": [
    "mnt.work.orders.create",
    "oracle.mnt.work.orders.create"
  ],
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "enableOracleWorkOrder": "N",
  "workOrderDescription": "Preventive maintenance on hydraulic pump",
  "woStatusCode": "UNRELEASED",
  "assetCode": "AST-001",
  "workOrderType": "Planned",
  "workOrderSubType": "Preventive",
  "workOrderPriority": "2",
  "operations": []
}
```

### Allowed Type/Subtype Combinations

| workOrderType | workOrderSubType |
| ------------- | ---------------- |
| Planned       | Preventive       |
| Planned       | Corrective       |
| Planned       | Inspection       |
| Planned       | TPM              |
| Not Planned   | Emergency        |

## Get Work Orders

### Endpoint

`GET /api/v1/work-orders`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Authorization       | string | Yes      | Bearer token             |
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
  { "field": "organizationCode", "operator": "eq", "value": "ORG-BOG-001" },
  { "field": "workOrderSubType", "operator": "eq", "value": "Preventive" }
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

### Example Query Payload (Human-Readable JSON)

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

### Gateway Processing

For find all, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Parses `filters` and `order` JSON strings from query parameters.
5. Extracts `userRoles` from the authenticated organization context.
6. Sends `work.order.find.all` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Find All)

```json
{
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"],
  "filters": [
    { "field": "organizationCode", "operator": "eq", "value": "ORG-BOG-001" },
    { "field": "workOrderSubType", "operator": "eq", "value": "Preventive" }
  ],
  "order": [["createdAt", "DESC"]],
  "limit": 10,
  "offset": 0
}
```

### Response (Find All)

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

### Endpoint

`GET /api/v1/work-orders/:workOrderCode`

### Headers Required

| Header              | Type   | Required | Description              |
| ------------------- | ------ | -------- | ------------------------ |
| Authorization       | string | Yes      | Bearer token             |
| X-Organization-Code | string | Yes      | Target organization code |

### Path Parameter

- `workOrderCode`

### Gateway Processing

For find one, the gateway:

1. Validates authentication.
2. Reads `X-Organization-Code`.
3. Verifies access to the organization.
4. Extracts `userRoles` from the authenticated organization context.
5. Sends `work.order.find.one` to the maintenance-execution microservice.

### NATS Payload Sent to Microservice (Find One)

```json
{
  "workOrderCode": "1001",
  "organizationCode": "ORG-BOG-001",
  "userRoles": ["PLANNER_MAINTENANCE_01"]
}
```

### Response (Find One)

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

## Error Mapping

| Status | Error Code / Message                      | Description                                          |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| 400    | X-Organization-Code header is required    | Missing org header in gateway                        |
| 400    | User does not have access to organization | User-org mismatch in authenticated context           |
| 400    | Invalid filter data                       | Invalid `filters`, `order`, `limit`, or `offset`     |
| 400    | organizationCode is required              | Missing organization context in microservice payload |
| 400    | userRoles must be a non-empty array       | Missing role context in microservice payload         |
| 403    | SUBTYPE_NOT_ALLOWED_FOR_ROLE              | User role cannot access the requested subtype        |
| 403    | ORGANIZATION_MISMATCH                     | Record belongs to a different organization           |
| 404    | Work order not found                      | The requested work order does not exist              |
| 500    | Internal server error                     | Unexpected failure                                   |
