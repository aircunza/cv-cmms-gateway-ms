# Work Order Module - Gateway

## Create Work Order

### Endpoint

```
POST /work-orders
```

### Headers Required

| Header                | Type   | Required | Description                                      |
| --------------------- | ------ | -------- | ------------------------------------------------ |
| Authorization         | string | Yes      | Bearer token from authentication                 |
| X-Organization-Code   | string | Yes      | Target organization code (e.g., "ORG-BOG-001")   |

### Request Body

#### Required Fields

| Field                | Type                        | Max Length | Description                                                          |
| -------------------- | --------------------------- | ---------- | -------------------------------------------------------------------- |
| workOrderDescription | string                      | 240        | Description of the work order.                                       |
| woStatusCode         | string                      | 30         | Status code in UPPER_SNAKE_CASE (e.g., "UNRELEASED", "RELEASED").    |
| assetCode            | string                      | 80         | Asset identifier.                                                    |
| workOrderType        | string                      | 30         | Work order type (e.g., "Planned", "Not Planned").                    |
| workOrderSubType     | string                      | 30         | Work order sub-type (e.g., "Preventive", "Corrective", "Emergency"). |
| workOrderPriority    | string ("1"\|"2"\|"3"\|"4") | -          | Priority level (1=highest, 4=lowest).                                |
| enableOracleWorkOrder| string ("Y"\|"N")           | 1          | Flag to enable Oracle integration.                                   |

#### Optional Fields

| Field                 | Type              | Description                                         |
| --------------------- | ----------------- | --------------------------------------------------- |
| workRequestId         | number            | Associated work request identifier.                 |
| workDefinitionCode    | string            | Work definition code.                               |
| schedulingMethod      | string            | Scheduling method.                                  |
| needByDate            | Date (ISO 8601)   | Date by which the work order needs to be completed. |
| plannedStartDate      | Date (ISO 8601)   | Planned start date.                                 |
| plannedCompletionDate | Date (ISO 8601)   | Planned completion date.                            |
| operations            | array             | Array of operations. If empty or missing, a default operation is created. |

#### Operation Object Structure

Each operation in the `operations` array:

| Field                | Type                    | Required | Description                                                                                     |
| -------------------- | ----------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| operationName        | string (2-120 chars)    | Yes      | Name of the operation.                                                                          |
| operationDescription | string (max 240 chars)  | Yes      | Description of the operation.                                                                   |
| operationSeqNumber   | integer (> 0)           | Yes      | Sequence number for ordering operations. Must be unique within the Work Order.                  |
| createdBy            | string (UUID)           | Yes      | User identifier who creates the operation.                                                      |
| operationStatus      | string                  | Yes      | One of: "UNRELEASED", "RELEASED", "IN_PROCESS", "COMPLETED", "NOT_DONE", "CANCELED", "ON_HOLD". |
| operationType        | string                  | Yes      | One of: "Internal", "Supplier".                                                                 |
| actualStartDate      | string (ISO 8601)       | Yes      | Operation start date. Must be before actualCompletionDate.                                      |
| actualCompletionDate | string (ISO 8601)       | Yes      | Operation completion date. Must be after actualStartDate.                                       |
| operationSubType     | string                  | Yes      | Must match the parent Work Order's `workOrderSubType`.                                          |
| workOrderOperationResource | array             | Yes      | Array of resource objects (at least one required).                                              |
| workOrderOperationMaterial | array             | No       | Array of material objects.                                                                      |

#### Resource Object Structure

| Field                  | Type              | Required | Description                                                                                |
| ---------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------ |
| resourceCode           | string            | Yes      | Resource identifier.                                                                       |
| resourceSequenceNumber | integer (>= 0)    | Yes      | Sequence number for grouping resources. Resources with the same sequence work in parallel. |
| plannedHours           | number (> 0)      | Yes      | Planned hours for the resource.                                                            |
| actualHours            | number (> 0)      | Yes      | Actual hours for the resource.                                                             |
| principalFlag          | string ("Y"\|"N") | Yes      | Principal flag indicator.                                                                  |
| hourlyCost             | number            | No       | Hourly cost of the resource.                                                               |
| plannedStartDate       | Date              | No       | Planned start date for the resource.                                                       |
| plannedCompletionDate  | Date              | No       | Planned completion date for resource.                                                      |

#### Material Object Structure

| Field                  | Type         | Required | Description               |
| ---------------------- | ------------ | -------- | ------------------------- |
| materialSequenceNumber | integer (>=1)| Yes      | Material sequence number. |
| quantity               | number (> 0) | Yes      | Quantity of material.     |
| supplyType             | string       | Yes      | Supply type code.         |
| materialCode           | string       | Yes      | Material identifier.      |

### Gateway Processing

The gateway performs the following steps before forwarding to the microservice:

1. **Authentication**: Validates the Bearer token via `auth.verify.user` NATS call.
2. **Organization Validation**: Reads `X-Organization-Code` header and verifies the user has access to that organization.
3. **Permission Extraction**: Extracts `permissions` and `roleCodes` from the user's roles in the target organization.
4. **Payload Enrichment**: Injects `actorId`, `actorName`, `organizationCode`, `userPermissions`, and `userRoles` into the NATS payload.

### NATS Payload Sent to Microservice

```json
{
  "actorId": "550e8400-e29b-41d4-a716-446655440001",
  "actorName": "John Doe",
  "organizationCode": "ORG-BOG-001",
  "userPermissions": ["mnt.work.orders.create", "oracle.mnt.work.orders.create"],
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
      "actualStartDate": "2025-11-21T08:00:00.000Z",
      "actualCompletionDate": "2025-11-21T10:00:00.000Z",
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

### Allowed Type/Subtype Combinations

| workOrderType | workOrderSubType |
| ------------- | ---------------- |
| Planned       | Preventive       |
| Planned       | Corrective       |
| Planned       | Inspection       |
| Planned       | TPM              |
| Not Planned   | Emergency        |

### Errors

| Status | Error Code                     | Description                                                        |
| ------ | ------------------------------ | ------------------------------------------------------------------ |
| 400    | Validation errors              | Missing required fields, invalid values, or invalid type/subtype.  |
| 400    | Bad request                    | Missing `X-Organization-Code` header or user lacks org access.     |
| 403    | MISSING_ORACLE_PERMISSION      | User lacks Oracle permission when `enableOracleWorkOrder = "Y"`.   |
| 403    | SUBTYPE_NOT_ALLOWED_FOR_ROLE   | User's role is not authorized for the requested sub-type.          |
| 403    | ORGANIZATION_MISMATCH          | Asset's organization does not match the target organization.       |
| 404    | Asset not found                | Asset does not exist or is inactive.                               |
| 500    | Internal server error          | Unexpected error.                                                  |
