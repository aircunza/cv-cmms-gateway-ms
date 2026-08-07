# cv-cmms-gateway-ms

Gateway for the CMMS maintenance execution microservice.

## Work Order Endpoints

### Create Work Order

**Endpoint:** `POST /work-orders`

**Headers:**

| Header              | Type   | Required | Description                                    |
| ------------------- | ------ | -------- | ---------------------------------------------- |
| Authorization       | string | Yes      | Bearer token from authentication               |
| X-Organization-Code | string | Yes      | Target organization code                       |

**Request Body:**

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
      ]
    }
  ]
}
```

**Required Fields:**

| Field                | Type                        | Description                                          |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| workOrderDescription | string (max 240)            | Description of the work order.                       |
| woStatusCode         | string (max 30)             | Status in UPPER_SNAKE_CASE (e.g., "UNRELEASED").     |
| assetCode            | string (max 80)             | Asset identifier.                                    |
| workOrderType        | string (max 30)             | "Planned" or "Not Planned".                          |
| workOrderSubType     | string (max 30)             | "Preventive", "Corrective", "Emergency", etc.        |
| workOrderPriority    | string ("1"\|"2"\|"3"\|"4") | Priority level (1=highest).                          |
| enableOracleWorkOrder| string ("Y"\|"N")           | Flag to enable Oracle integration.                   |

**Allowed Type/Subtype Combinations:**

| workOrderType | workOrderSubType           |
| ------------- | -------------------------- |
| Planned       | Preventive, Corrective, Inspection, TPM |
| Not Planned   | Emergency                  |

**Operations (optional):** If not provided, a default operation is created automatically.

**Example with cURL:**

```bash
curl -X POST http://localhost:3000/work-orders \
  -H "Authorization: Bearer <your-token>" \
  -H "X-Organization-Code: ORG-BOG-001" \
  -H "Content-Type: application/json" \
  -d '{
    "workOrderDescription": "Preventive maintenance",
    "woStatusCode": "UNRELEASED",
    "assetCode": "AST-001",
    "workOrderType": "Planned",
    "workOrderSubType": "Preventive",
    "workOrderPriority": "2",
    "enableOracleWorkOrder": "N"
  }'
```

### Other Endpoints

| Method | Path                        | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | /work-orders                | List all work orders     |
| GET    | /work-orders/:workOrderCode | Get work order by code   |
| PATCH  | /work-orders/:workOrderCode | Update work order        |
| PATCH  | /work-orders/:workOrderCode/release | Release work order |
| PATCH  | /work-orders/:workOrderCode/complete | Complete work order |
| PATCH  | /work-orders/:workOrderCode/close | Close work order       |
| PATCH  | /work-orders/:workOrderCode/cancel | Cancel work order     |
