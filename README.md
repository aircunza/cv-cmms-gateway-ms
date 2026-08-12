# cv-cmms-gateway-ms

Gateway for the CMMS maintenance execution microservice.

## Base URL

`/api/v1`

## Auth

| Method | Endpoint              | Description                        |
| ------ | --------------------- | ---------------------------------- |
| GET    | /api/v1/auth/health   | Health check (no auth)             |
| POST   | /api/v1/auth/register | Register a new user (no auth)      |
| POST   | /api/v1/auth/login    | Login with email or code (no auth) |
| POST   | /api/v1/auth/logout   | Logout                             |
| GET    | /api/v1/auth/verify   | Verify current token               |

### Register

Request:

```json
{
  "code": "JDOE01",
  "userName": "John Doe",
  "userShortName": "John Doe",
  "email": "john.doe@company.com",
  "password": "secret123"
}
```

Response:

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "JDOE01",
    "email": "john.doe@company.com",
    "userName": "John Doe",
    "userShortName": "John Doe",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null,
    "isActive": "Y",
    "isVerified": "N",
    "addAttribute1": null,
    "addAttribute2": null,
    "addAttribute3": null,
    "addAttribute4": null,
    "addAttribute5": null
  },
  "token": "<jwt>"
}
```

### Login

Provide exactly one identifier: `email` or `code`.

Request:

```json
{
  "email": "john.doe@company.com",
  "password": "secret123"
}
```

Response:

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "JDOE01",
    "email": "john.doe@company.com",
    "userName": "John Doe",
    "userShortName": "John Doe",
    "isActive": "Y",
    "isVerified": "N"
  },
  "organizations": [
    {
      "organizationId": "550e8400-e29b-41d4-a716-446655440002",
      "organizationCode": "ORG-BOG-001",
      "organizationName": "Bogota Plant",
      "countryCode": "CO",
      "countryName": "Colombia",
      "timezone": "America/Bogota",
      "roles": [
        {
          "roleCode": "PLANNER_MAINTENANCE_01",
          "roleName": "Maintenance Planner 1",
          "roleDescription": "Plans maintenance work",
          "permissions": ["mnt.work.orders.create", "mnt.work.orders.view"],
          "deniedPermissions": null
        }
      ]
    }
  ],
  "token": "<jwt>"
}
```

### Logout

Response:

```json
{
  "success": true
}
```

### Verify

Response: same shape as login (`user`, `organizations`, `token`), `token` echoes the input token.

### Health

Response:

```json
{
  "status": "ok",
  "message": "Auth service is running"
}
```

## Organizations

| Method | Endpoint                             | Description      |
| ------ | ------------------------------------ | ---------------- |
| POST   | /api/v1/organizations                | Create           |
| GET    | /api/v1/organizations                | List             |
| GET    | /api/v1/organizations/:id            | Get by id (UUID) |
| PATCH  | /api/v1/organizations/:id            | Update           |
| PATCH  | /api/v1/organizations/:id/deactivate | Deactivate       |

### Create

Request:

```json
{
  "code": "ORG-BOG-001",
  "name": "Bogota Plant",
  "countryCode": "CO",
  "countryName": "Colombia",
  "timezone": "America/Bogota",
  "offsetMinutes": -300
}
```

Response:

```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "ORG-BOG-001",
    "name": "Bogota Plant",
    "countryCode": "CO",
    "countryName": "Colombia",
    "timezone": "America/Bogota",
    "offsetMinutes": -300,
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z"
  }
}
```

### List

`GET /api/v1/organizations?code=ORG&name=Bogota&countryCode=CO` (all optional).

Response:

```json
{
  "organizations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "code": "ORG-BOG-001",
      "name": "Bogota Plant",
      "countryCode": "CO",
      "countryName": "Colombia",
      "timezone": "America/Bogota",
      "offsetMinutes": -300,
      "isActive": "Y",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "updatedAt": "2026-08-07T15:12:00.000Z"
    }
  ],
  "total": 1
}
```

### Get by id

Response:

```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "ORG-BOG-001",
    "name": "Bogota Plant",
    "countryCode": "CO",
    "countryName": "Colombia",
    "timezone": "America/Bogota",
    "offsetMinutes": -300,
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z"
  }
}
```

### Update

Request (all fields optional; `code` cannot be changed):

```json
{
  "name": "Bogota Plant 2",
  "offsetMinutes": -240
}
```

Response: `{ "organization": { ... } }` (same shape as Get by id).

### Deactivate

`PATCH /api/v1/organizations/:id/deactivate` (no body).

Response:

```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "ORG-BOG-001",
    "name": "Bogota Plant",
    "isActive": "N",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:20:00.000Z"
  },
  "message": "Organization deactivated successfully"
}
```

## User Org Permissions

| Method | Endpoint                                    | Description      |
| ------ | ------------------------------------------- | ---------------- |
| POST   | /api/v1/user-org-permissions                | Create           |
| GET    | /api/v1/user-org-permissions                | List             |
| GET    | /api/v1/user-org-permissions/:id            | Get by id (UUID) |
| PATCH  | /api/v1/user-org-permissions/:id            | Update           |
| PATCH  | /api/v1/user-org-permissions/:id/deactivate | Deactivate       |

### Create

Request:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "organizationId": "550e8400-e29b-41d4-a716-446655440002",
  "roleCode": "PLANNER_MAINTENANCE_01",
  "roleName": "Maintenance Planner 1",
  "roleDescription": "Plans maintenance work",
  "permissions": ["mnt.work.orders.create", "mnt.work.orders.view"],
  "deniedPermissions": [],
  "assignedAt": "2026-08-07T15:12:00.000Z"
}
```

Response:

```json
{
  "userOrgPermission": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "organizationId": "550e8400-e29b-41d4-a716-446655440002",
    "roleCode": "PLANNER_MAINTENANCE_01",
    "roleName": "Maintenance Planner 1",
    "roleDescription": "Plans maintenance work",
    "permissions": ["mnt.work.orders.create", "mnt.work.orders.view"],
    "deniedPermissions": [],
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z",
    "assignedAt": "2026-08-07T15:12:00.000Z"
  }
}
```

### List

`GET /api/v1/user-org-permissions?userId=&organizationId=&roleCode=&isActive=Y` (all optional).

Response:

```json
{
  "userOrgPermissions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "organizationId": "550e8400-e29b-41d4-a716-446655440002",
      "roleCode": "PLANNER_MAINTENANCE_01",
      "roleName": "Maintenance Planner 1",
      "roleDescription": "Plans maintenance work",
      "permissions": ["mnt.work.orders.create", "mnt.work.orders.view"],
      "deniedPermissions": [],
      "isActive": "Y",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "updatedAt": "2026-08-07T15:12:00.000Z",
      "assignedAt": "2026-08-07T15:12:00.000Z"
    }
  ],
  "total": 1
}
```

### Get by id

Response:

```json
{
  "userOrgPermission": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "organizationId": "550e8400-e29b-41d4-a716-446655440002",
    "roleCode": "PLANNER_MAINTENANCE_01",
    "roleName": "Maintenance Planner 1",
    "roleDescription": "Plans maintenance work",
    "permissions": ["mnt.work.orders.create", "mnt.work.orders.view"],
    "deniedPermissions": [],
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z",
    "assignedAt": "2026-08-07T15:12:00.000Z"
  }
}
```

### Update

Request (`updates` is nested):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "updates": {
    "roleCode": "SUPERVISOR_MAINTENANCE_01",
    "permissions": ["mnt.work.orders.view"],
    "deniedPermissions": ["mnt.work.orders.cancel"]
  }
}
```

Response: `{ "userOrgPermission": { ... } }` (same shape as Get by id).

### Deactivate

`PATCH /api/v1/user-org-permissions/:id/deactivate` (no body).

Response:

```json
{
  "userOrgPermission": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "roleCode": "SUPERVISOR_MAINTENANCE_01",
    "isActive": "N",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": "2026-08-07T15:20:00.000Z",
    "assignedAt": "2026-08-07T15:12:00.000Z"
  },
  "message": "User organization permission deactivated successfully"
}
```

## Assets

| Method | Endpoint                             | Description       |
| ------ | ------------------------------------ | ----------------- |
| POST   | /api/v1/assets                       | Create            |
| GET    | /api/v1/assets/:assetCode            | Get by asset code |
| GET    | /api/v1/assets                       | List              |
| PATCH  | /api/v1/assets/:assetCode            | Update            |
| PATCH  | /api/v1/assets/:assetCode/deactivate | Deactivate        |

The gateway injects `actorCode` (from the authenticated user) into the create/update/deactivate payloads; the client does not send it.

### Create

Request:

```json
{
  "assetCode": "PMP-1001",
  "assetDescription": "Centrifugal pump",
  "assetShortDescription": "Centrifugal Pump",
  "assetStatus": "OPERATIVE",
  "organizationCode": "ORG-BOG-001",
  "workCenterId": "550e8400-e29b-41d4-a716-446655440004",
  "sector": "Production",
  "subsector": "Line A",
  "enabledMaintenanceProgram": "Y",
  "enabledMaintenanceHoursControl": "N",
  "woAllowedFlag": "Y"
}
```

Response:

```json
{
  "asset": {
    "assetCode": "PMP-1001",
    "assetDescription": "Centrifugal pump",
    "assetShortDescription": "Centrifugal Pump",
    "assetStatus": "OPERATIVE",
    "operationalHoursOrigin": null,
    "organizationCode": "ORG-BOG-001",
    "organizationName": "Bogota Plant",
    "countryCode": "CO",
    "countryName": "Colombia",
    "workCenterId": "550e8400-e29b-41d4-a716-446655440004",
    "workCenterCode": "WC-01",
    "workCenterDescription": "Main Workshop",
    "centerCostCode": 101,
    "workAreaCode": "WA-01",
    "workAreaDescription": "Plant Floor",
    "accountingAccountCode": null,
    "supervisorCode": null,
    "assetDependency": null,
    "processTypeCode": null,
    "subprocessTypeCode": null,
    "hierarchyCode": null,
    "assetClass": null,
    "enabledMaintenanceProgram": "Y",
    "enabledMaintenanceHoursControl": "N",
    "enabledFinancialKpi": null,
    "enabledTechnicalKpi": null,
    "woAllowedFlag": "Y",
    "enabledIiot": null,
    "sector": "Production",
    "subsector": "Line A",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedBy": null,
    "updateUp": null,
    "createdAt": "2026-08-07T15:12:00.000Z",
    "isActive": "Y"
  }
}
```

### Get by code

Response:

```json
{
  "asset": {
    "assetCode": "PMP-1001",
    "assetDescription": "Centrifugal pump",
    "assetShortDescription": "Centrifugal Pump",
    "assetStatus": "OPERATIVE",
    "organizationCode": "ORG-BOG-001",
    "organizationName": "Bogota Plant",
    "workCenterCode": "WC-01",
    "workCenterDescription": "Main Workshop",
    "workAreaCode": "WA-01",
    "workAreaDescription": "Plant Floor",
    "enabledMaintenanceProgram": "Y",
    "sector": "Production",
    "subsector": "Line A",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "isActive": "Y"
  }
}
```

### List

`GET /api/v1/assets?organizationCode=ORG-BOG-001&assetStatus=OPERATIVE&isActive=Y` (all optional; `isActive` defaults to `Y`).

Response:

```json
{
  "assets": [
    {
      "assetCode": "PMP-1001",
      "assetDescription": "Centrifugal pump",
      "assetShortDescription": "Centrifugal Pump",
      "assetStatus": "OPERATIVE",
      "organizationCode": "ORG-BOG-001",
      "organizationName": "Bogota Plant",
      "workCenterCode": "WC-01",
      "workCenterDescription": "Main Workshop",
      "workAreaCode": "WA-01",
      "workAreaDescription": "Plant Floor",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "isActive": "Y"
    }
  ],
  "total": 1
}
```

### Update

`PATCH /api/v1/assets/:assetCode` (all fields optional, `assetCode` comes from the path).

Request:

```json
{
  "assetDescription": "Centrifugal pump - updated",
  "isActive": "Y"
}
```

Response: `{ "asset": { ... } }` (same shape as Get by code).

### Deactivate

`PATCH /api/v1/assets/:assetCode/deactivate` (no body).

Response:

```json
{
  "asset": {
    "assetCode": "PMP-1001",
    "isActive": "N",
    "createdAt": "2026-08-07T15:12:00.000Z"
  },
  "message": "Asset deactivated successfully"
}
```

## Work Centers

| Method | Endpoint                            | Description      |
| ------ | ----------------------------------- | ---------------- |
| POST   | /api/v1/work-centers                | Create           |
| GET    | /api/v1/work-centers/:id            | Get by id (UUID) |
| GET    | /api/v1/work-centers                | List             |
| PATCH  | /api/v1/work-centers/:id            | Update           |
| PATCH  | /api/v1/work-centers/:id/deactivate | Deactivate       |

### Create

Request:

```json
{
  "workCenterCode": "WC-01",
  "workCenterDescription": "Main Workshop",
  "workAreaId": "550e8400-e29b-41d4-a716-446655440005",
  "centerCostCode": 101,
  "centerCostDescription": "Maintenance Cost Center"
}
```

Response:

```json
{
  "workCenter": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "workCenterCode": "WC-01",
    "workCenterDescription": "Main Workshop",
    "workAreaId": "550e8400-e29b-41d4-a716-446655440005",
    "centerCostCode": 101,
    "centerCostDescription": "Maintenance Cost Center",
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null
  }
}
```

### Get by id

Response:

```json
{
  "workCenter": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "workCenterCode": "WC-01",
    "workCenterDescription": "Main Workshop",
    "workAreaId": "550e8400-e29b-41d4-a716-446655440005",
    "centerCostCode": 101,
    "centerCostDescription": "Maintenance Cost Center",
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null
  }
}
```

### List

`GET /api/v1/work-centers?workCenterCode=WC&workAreaId=&isActive=Y` (all optional; `isActive` defaults to `Y`).

Response:

```json
{
  "workCenters": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "workCenterCode": "WC-01",
      "workCenterDescription": "Main Workshop",
      "workAreaId": "550e8400-e29b-41d4-a716-446655440005",
      "centerCostCode": 101,
      "centerCostDescription": "Maintenance Cost Center",
      "isActive": "Y",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "updatedAt": null
    }
  ],
  "total": 1
}
```

### Update

`PATCH /api/v1/work-centers/:id` (all fields optional).

Request:

```json
{
  "workCenterDescription": "Main Workshop - updated",
  "isActive": "Y"
}
```

Response: `{ "workCenter": { ... } }` (same shape as Get by id).

### Deactivate

`PATCH /api/v1/work-centers/:id/deactivate` (no body).

Response:

```json
{
  "workCenter": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "workCenterCode": "WC-01",
    "isActive": "N",
    "createdAt": "2026-08-07T15:12:00.000Z"
  },
  "message": "Work center deactivated successfully"
}
```

## Work Areas

| Method | Endpoint                          | Description      |
| ------ | --------------------------------- | ---------------- |
| POST   | /api/v1/work-areas                | Create           |
| GET    | /api/v1/work-areas/:id            | Get by id (UUID) |
| GET    | /api/v1/work-areas                | List             |
| PATCH  | /api/v1/work-areas/:id            | Update           |
| PATCH  | /api/v1/work-areas/:id/deactivate | Deactivate       |

### Create

Request:

```json
{
  "workAreaCode": "WA-01",
  "workAreaDescription": "Plant Floor",
  "organizationCode": "ORG-BOG-001"
}
```

Response:

```json
{
  "workArea": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "workAreaCode": "WA-01",
    "workAreaDescription": "Plant Floor",
    "organizationCode": "ORG-BOG-001",
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null
  }
}
```

### Get by id

Response:

```json
{
  "workArea": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "workAreaCode": "WA-01",
    "workAreaDescription": "Plant Floor",
    "organizationCode": "ORG-BOG-001",
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null
  }
}
```

### List

`GET /api/v1/work-areas?workAreaCode=WA&organizationCode=ORG-BOG-001&isActive=Y` (all optional; `isActive` defaults to `Y`).

Response:

```json
{
  "workAreas": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "workAreaCode": "WA-01",
      "workAreaDescription": "Plant Floor",
      "organizationCode": "ORG-BOG-001",
      "isActive": "Y",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "updatedAt": null
    }
  ],
  "total": 1
}
```

### Update

`PATCH /api/v1/work-areas/:id` (all fields optional).

Request:

```json
{
  "workAreaDescription": "Plant Floor - updated",
  "isActive": "Y"
}
```

Response: `{ "workArea": { ... } }` (same shape as Get by id).

### Deactivate

`PATCH /api/v1/work-areas/:id/deactivate` (no body).

Response:

```json
{
  "workArea": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "workAreaCode": "WA-01",
    "isActive": "N",
    "createdAt": "2026-08-07T15:12:00.000Z"
  },
  "message": "Work area deactivated successfully"
}
```

## Human Resources

| Method | Endpoint                                         | Description                                          |
| ------ | ------------------------------------------------ | ---------------------------------------------------- |
| POST   | /api/v1/human-resources                          | Create                                               |
| GET    | /api/v1/human-resources/:resourceCode            | Get by resource code (requires `?organizationCode=`) |
| GET    | /api/v1/human-resources                          | List                                                 |
| PATCH  | /api/v1/human-resources/:resourceCode            | Update (requires `?organizationCode=`)               |
| PATCH  | /api/v1/human-resources/:resourceCode/deactivate | Deactivate (requires `?organizationCode=`)           |

The gateway injects `actorId` and `actorName` (from the authenticated user) into the create/update/deactivate payloads; the client does not send them.

### Create

Request:

```json
{
  "resourceCode": "RES-001",
  "resourceName": "John Doe",
  "resourceType": "TECHNICIAN",
  "organizationCode": "ORG-BOG-001",
  "availabilityStatus": "AVAILABLE",
  "supervisorName": "Jane Smith"
}
```

Response:

```json
{
  "humanResource": {
    "resourceCode": "RES-001",
    "resourceName": "John Doe",
    "resourceType": "TECHNICIAN",
    "organizationCode": "ORG-BOG-001",
    "organizationName": "Bogota Plant",
    "availabilityStatus": "AVAILABLE",
    "supervisorId": null,
    "supervisorName": "Jane Smith",
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null,
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
    "updatedBy": null,
    "updatedByName": null
  }
}
```

### Get by resource code

`GET /api/v1/human-resources/RES-001?organizationCode=ORG-BOG-001` (query param required).

Response:

```json
{
  "humanResource": {
    "resourceCode": "RES-001",
    "resourceName": "John Doe",
    "resourceType": "TECHNICIAN",
    "organizationCode": "ORG-BOG-001",
    "organizationName": "Bogota Plant",
    "availabilityStatus": "AVAILABLE",
    "supervisorId": null,
    "supervisorName": "Jane Smith",
    "isActive": "Y",
    "createdAt": "2026-08-07T15:12:00.000Z",
    "updatedAt": null
  }
}
```

### List

`GET /api/v1/human-resources?organizationCode=ORG-BOG-001&resourceType=TECHNICIAN&availabilityStatus=AVAILABLE` (all optional).

Response:

```json
{
  "humanResources": [
    {
      "resourceCode": "RES-001",
      "resourceName": "John Doe",
      "resourceType": "TECHNICIAN",
      "organizationCode": "ORG-BOG-001",
      "availabilityStatus": "AVAILABLE",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "isActive": "Y"
    }
  ],
  "total": 1
}
```

### Update

`PATCH /api/v1/human-resources/RES-001?organizationCode=ORG-BOG-001` (all fields optional).

Request:

```json
{
  "availabilityStatus": "UNAVAILABLE",
  "resourceName": "John Doe"
}
```

Response: `{ "humanResource": { ... } }` (same shape as Get by resource code).

### Deactivate

`PATCH /api/v1/human-resources/RES-001/deactivate?organizationCode=ORG-BOG-001` (no body).

Response:

```json
{
  "humanResource": {
    "resourceCode": "RES-001",
    "isActive": "N",
    "createdAt": "2026-08-07T15:12:00.000Z"
  }
}
```

## Work Orders

Headers required for all Work Order endpoints:

- `Cookie: token=<jwt>`
- `X-Organization-Code: <organization-code>`

| Method | Endpoint                                            | Description      |
| ------ | --------------------------------------------------- | ---------------- |
| POST   | /api/v1/work-orders                                 | Create           |
| GET    | /api/v1/work-orders                                 | List             |
| GET    | /api/v1/work-orders/:workOrderCode                  | Get by code      |
| PATCH  | /api/v1/work-orders/:workOrderCode                  | Update           |
| PATCH  | /api/v1/work-orders/:workOrderCode/release          | Release          |
| PATCH  | /api/v1/work-orders/:workOrderCode/hold             | Hold             |
| PATCH  | /api/v1/work-orders/:workOrderCode/complete         | Complete         |
| PATCH  | /api/v1/work-orders/:workOrderCode/close            | Close            |
| PATCH  | /api/v1/work-orders/:workOrderCode/cancel           | Cancel           |
| PATCH  | /api/v1/work-orders/:workOrderCode/pending-approval | Pending approval |

For the full contract (permissions, roles, field constraints, allowed type/subtype combinations), see the [Work Order spec](src/maintenance-execution/docs/work-order-spec.md).

### Create Work Order

`POST /api/v1/work-orders`

The `operations` array is required and must contain at least one operation.

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

Response `201 Created`:

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
            "updatedAt": "2026-08-07T15:12:00.000Z"
          }
        ],
        "workOrderOperationMaterial": []
      }
    ]
  }
}
```

### Get Work Orders

`GET /api/v1/work-orders`

Query parameters:

- `filters`: JSON string (required)
- `order`: JSON string (optional)
- `limit`: non-negative integer (optional)
- `offset`: non-negative integer (optional)

Supported operators: `eq`, `like`, `gt`, `lt`, `in`.

Allowed filter fields: `workOrderCode`, `assetCode`, `workOrderDescription`, `woStatusCode`, `workOrderType`, `workOrderSubType`, `organizationCode`, `workCenterCode`, `workAreaCode`, `createdAt`, `actualStartDate`, `actualCompletionDate`, `releasedDate`, `closedDate`, `canceledDate`.

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
      "organizationCode": "ORG-BOG-001",
      "organizationName": "Bogota Plant",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "createdByName": "John Doe",
      "createdAt": "2026-08-07T15:12:00.000Z",
      "updatedAt": "2026-08-07T15:12:00.000Z",
      "enableOracleWorkOrder": "N",
      "releasedDate": null,
      "closedDate": null,
      "canceledDate": null,
      "operations": [
        {
          "operationCode": "5001",
          "operationName": "Lubrication",
          "operationStatus": "UNRELEASED",
          "operationStatusLabel": "Unreleased",
          "operationType": "Internal"
        }
      ]
    }
  ],
  "total": 1
}
```

### Get Work Order By Code

`GET /api/v1/work-orders/:workOrderCode`

Response: returns the Work Order wrapped in `workOrder`, including all nested operations, resources, and materials (same structure as the Create response, single object instead of an array).

### Update Work Order

`PATCH /api/v1/work-orders/:workOrderCode`

`enableOracleWorkOrder` is required; all other fields are optional (partial update).

Request body example:

```json
{
  "enableOracleWorkOrder": "N",
  "workOrderDescription": "Updated description"
}
```

Response: returns the updated Work Order wrapped in `workOrder` (full shape as in Create).

### Release Work Order

`PATCH /api/v1/work-orders/:workOrderCode/release`

Transitions from `UNRELEASED` or `ON_HOLD` to `RELEASED`. Sets `releasedDate` and all operations' `operationStatus` to `RELEASED`. No body.

Response example:

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "woStatusCode": "RELEASED",
    "releasedDate": "2026-08-07T15:12:00.000Z"
  }
}
```

### Hold On Work Order

`PATCH /api/v1/work-orders/:workOrderCode/hold`

Transitions from `UNRELEASED` or `RELEASED` to `ON_HOLD`. No body.

Response example:

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "woStatusCode": "ON_HOLD"
  }
}
```

### Complete Work Order

`PATCH /api/v1/work-orders/:workOrderCode/complete`

Transitions from `RELEASED` to `COMPLETED`. Sets all operations' `operationStatus` to `COMPLETED`. No body.

Response example:

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "woStatusCode": "COMPLETED"
  }
}
```

### Close Work Order

`PATCH /api/v1/work-orders/:workOrderCode/close`

Transitions from `COMPLETED` to `CLOSED`. Sets `closedDate`. No body.

Response example:

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "woStatusCode": "CLOSED",
    "closedDate": "2026-08-07T16:00:00.000Z"
  }
}
```

### Cancel Work Order

`PATCH /api/v1/work-orders/:workOrderCode/cancel`

Cancels the Work Order and all its operations; sets `canceledDate` and `canceledReason`.

Request body example:

```json
{
  "canceledReason": "No replacement parts available"
}
```

Response example:

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "woStatusCode": "CANCELED",
    "canceledDate": "2026-08-07T16:30:00.000Z",
    "canceledReason": "No replacement parts available"
  }
}
```

### Pending Approval Work Order

`PATCH /api/v1/work-orders/:workOrderCode/pending-approval`

Transitions from `PENDING_APPROVAL` to `UNRELEASED`. No body.

Response example:

```json
{
  "workOrder": {
    "workOrderCode": "1001",
    "woStatusCode": "UNRELEASED"
  }
}
```

### Status Transitions

| From Status      | Allowed Transitions To       |
| ---------------- | ---------------------------- |
| UNRELEASED       | ON_HOLD, RELEASED, CANCELED  |
| RELEASED         | COMPLETED, ON_HOLD, CANCELED |
| ON_HOLD          | RELEASED, CANCELED           |
| COMPLETED        | CLOSED                       |
| CLOSED           | None (terminal)              |
| CANCELED         | None (terminal)              |
| PENDING_APPROVAL | UNRELEASED                   |

### Errors

| Status | Message                                   | Description                                      |
| ------ | ----------------------------------------- | ------------------------------------------------ |
| 400    | X-Organization-Code header is required    | Missing org header                               |
| 400    | User does not have access to organization | User-org mismatch                                |
| 400    | Validation errors                         | Missing or invalid fields                        |
| 400    | Invalid filter data                       | Invalid `filters`, `order`, `limit`, or `offset` |
| 400    | Invalid status transition                 | Work Order cannot transition from current status |
| 400    | canceledReason is required / too long     | Cancel reason missing or longer than 240 chars   |
| 403    | MISSING_PERMISSION                        | User lacks required permission                   |
| 403    | MISSING_ORACLE_PERMISSION                 | Missing Oracle permission when Oracle is enabled |
| 403    | SUBTYPE_NOT_ALLOWED_FOR_ROLE              | User's role cannot access the requested subtype  |
| 403    | ORGANIZATION_MISMATCH                     | Record belongs to a different organization       |
| 404    | Work order not found or inactive          | The specified work order does not exist          |
| 500    | Internal server error                     | Unexpected failure                               |

## Work Requests

Headers required for all Work Request endpoints:

- `Cookie: token=<jwt>`
- `X-Organization-Code: <organization-code>`

| Method | Endpoint                                  | Description              |
| ------ | ----------------------------------------- | ------------------------ |
| POST   | /api/v1/work-requests                     | Create                   |
| GET    | /api/v1/work-requests                     | List                     |
| GET    | /api/v1/work-requests/:requestId          | Get by id                |
| PATCH  | /api/v1/work-requests/:requestId          | Update issue description |
| PATCH  | /api/v1/work-requests/:requestId/complete | Complete                 |
| PATCH  | /api/v1/work-requests/:requestId/cancel   | Cancel                   |

For the full contract (permissions, roles, field constraints), see the [Work Request spec](src/maintenance-execution/docs/work-request-spec.md).

### Create Work Request

`POST /api/v1/work-requests`

> **Initial data requirement:** Before using this endpoint, the maintenance-execution database SHALL contain at least one human resource with `resourceCode = "DEFAULT_RESOURCE"`. Creating a Work Request auto-generates a default operation that references this resource; if it is missing, creation fails with an FK constraint violation.

Request body example:

```json
{
  "assetCode": "AST-001",
  "assetShortDescription": "Hydraulic Pump",
  "issueDescription": "Oil leak detected on the hydraulic pump.",
  "enableOracleWorkOrder": "N"
}
```

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

`GET /api/v1/work-requests`

Query parameters:

- `filters`: JSON string (required)
- `order`: JSON string (optional)
- `limit`: non-negative integer (optional)
- `offset`: non-negative integer (optional)

Supported operators: `eq`, `like`, `gt`, `lt`, `in`.

Allowed filter fields: `requestId`, `assetCode`, `issueDescription`, `statusCode`, `organizationCode`, `workAreaCode`, `createdAt`, `requestedAt`, `releasedAt`, `completedAt`, `canceledAt`.

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
      "organizationCode": "ORG-BOG-001",
      "organizationName": "Bogota Plant",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "createdByName": "John Doe",
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

`GET /api/v1/work-requests/:requestId`

Path parameter: `requestId` (numeric identifier of the Work Request).

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
    "organizationCode": "ORG-BOG-001",
    "organizationName": "Bogota Plant",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
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

`PATCH /api/v1/work-requests/:requestId`

Request body example:

```json
{
  "issueDescription": "Oil leak detected on the hydraulic pump - updated."
}
```

Required permission: `mnt.work.request.update`.

Response: returns the updated Work Request (same shape as Get By ID).

### Complete Work Request

`PATCH /api/v1/work-requests/:requestId/complete`

Purpose: transitions a Work Request from `RELEASED` to `COMPLETED`. This action does **not** affect the associated Work Order.

Required permission: `mnt.work.request.complete`.

Authorized roles: `MANUFACTURING_FACILITATOR`, `TECHNICIAN_MAINTENANCE_01`, `TECHNICIAN_MAINTENANCE_02`, `PLANNER_MAINTENANCE_01`, `PLANNER_MAINTENANCE_02`, `COORDINATOR_MAINTENANCE_01`, `COORDINATOR_MAINTENANCE_02`, `SUPERVISOR_MAINTENANCE_01`, `SUPERVISOR_MAINTENANCE_02`, `ADMIN`.

Response: returns the Work Request with `statusCode: "COMPLETED"` and `completedAt` set.

### Cancel Work Request

`PATCH /api/v1/work-requests/:requestId/cancel`

Purpose: cancels a Work Request and its associated Work Order. If Oracle integration is enabled and the Work Order was created in Oracle, it also cancels the Work Order in Oracle Fusion.

Required permissions: `mnt.work.request.cancel`, `mnt.work.orders.cancel`. When Oracle integration is enabled and the WO was synced to Oracle, also requires `oracle.mnt.work.orders.cancel`.

Role restriction: only **MANUFACTURING_FACILITATOR** is authorized to cancel Work Requests.

Response: returns the Work Request with `statusCode: "CANCELED"` and `canceledAt` set.

### Status Transitions

| From Status | Allowed Transitions To |
| ----------- | ---------------------- |
| RELEASED    | COMPLETED, CANCELED    |
| COMPLETED   | CANCELED               |
| CANCELED    | None (terminal)        |

Impact on the associated Work Order:

| Work Request Transition | Work Order Impact                                               |
| ----------------------- | --------------------------------------------------------------- |
| RELEASED → COMPLETED    | None                                                            |
| RELEASED → CANCELED     | WO canceled, all operations canceled, Oracle sync if applicable |
| COMPLETED → CANCELED    | WO canceled, all operations canceled, Oracle sync if applicable |

### Errors

| Status | Message                                   | Description                                                  |
| ------ | ----------------------------------------- | ------------------------------------------------------------ |
| 400    | X-Organization-Code header is required    | Missing org header                                           |
| 400    | User does not have access to organization | User-org mismatch                                            |
| 400    | Validation errors                         | Missing or invalid fields                                    |
| 400    | Invalid filter data                       | Invalid `filters`, `order`, `limit`, or `offset`             |
| 400    | Invalid status transition                 | Work Request cannot transition from current status           |
| 403    | MISSING_PERMISSION                        | User lacks required permission                               |
| 403    | MISSING_ORACLE_PERMISSION                 | Missing Oracle permission when Oracle integration is enabled |
| 403    | ROLE_NOT_AUTHORIZED                       | User's role is not authorized for this action                |
| 403    | ORGANIZATION_MISMATCH                     | Asset belongs to a different organization                    |
| 404    | Asset not found or inactive               | The specified asset does not exist or is inactive            |
| 404    | Work request not found                    | The specified Work Request does not exist                    |
