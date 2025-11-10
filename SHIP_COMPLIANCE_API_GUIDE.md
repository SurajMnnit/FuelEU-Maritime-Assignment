# Ship Compliance API Guide

## Overview

The Ship Compliance APIs allow you to manage compliance balances (CB) for individual ships. These APIs enable you to:
- **Search** for a specific ship's compliance data
- **View** all ships' compliance data for a given year
- **Compute** compliance balances based on route data

## API Endpoints

### 1. GET `/api/ship-compliance/:shipId/:year`
**Purpose**: Retrieve compliance balance for a specific ship and year

**Use Case**: 
- Check if a specific ship has compliance data
- View detailed compliance information for a single ship
- Verify compliance status before operations

**Example Request**:
```
GET /api/ship-compliance/R002/2024
```

**Response** (200 OK):
```json
{
  "id": 1,
  "shipId": "R002",
  "year": 2024,
  "cbGco2eq": 6808.0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "error": "Compliance balance not found for ship R002 in year 2024"
}
```

---

### 2. GET `/api/ship-compliance/year/:year`
**Purpose**: Get all ship compliance balances for a given year

**Use Case**:
- View compliance overview for all ships in a year
- Identify ships with surplus or deficit
- Generate reports for a specific year
- Compare compliance across multiple ships

**Example Request**:
```
GET /api/ship-compliance/year/2024
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "shipId": "R001",
    "year": 2024,
    "cbGco2eq": -10840.0,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "shipId": "R002",
    "year": 2024,
    "cbGco2eq": 6808.0,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

**Response** (200 OK - Empty):
```json
[]
```

---

### 3. POST `/api/ship-compliance/compute`
**Purpose**: Compute and save compliance balance for a ship based on route data

**Use Case**:
- Calculate compliance balance when route data is available
- Initialize compliance data for a new ship
- Recalculate compliance after route changes
- Automate compliance calculations

**How it works**:
1. Looks up the route data (GHG intensity and fuel consumption)
2. Calculates: `CB = (Target - Actual GHG Intensity) × Fuel Consumption`
3. Saves the result to the database
4. Returns the computed compliance balance

**Target GHG Intensity**: 89.3368 gCO₂e/MJ

**Example Request**:
```json
POST /api/ship-compliance/compute
Content-Type: application/json

{
  "shipId": "R002",
  "year": 2024,
  "routeId": "R002"
}
```

**Note**: If `routeId` is not provided, it will use `shipId` as the `routeId`.

**Response** (200 OK):
```json
{
  "id": 2,
  "shipId": "R002",
  "year": 2024,
  "cbGco2eq": 6808.0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response** (400 Bad Request):
```json
{
  "error": "shipId is required and must be a non-empty string"
}
```

**Response** (500 Internal Server Error):
```json
{
  "error": "Route R002 does not exist. Available routes: R001, R002, R003, R004, R005"
}
```

---

## Frontend Integration

### New Page: Ship Compliance Management

The frontend now includes a new **"Ship CB"** tab that provides three views:

#### 1. **Search Ship** Tab
- Enter a Ship ID and Year
- Click "Search" to find compliance data
- Displays detailed compliance information if found
- Shows status badge (Compliant/Non-Compliant)

#### 2. **All Ships** Tab
- Select a year to view all ships
- Displays a table with all ship compliance data
- Shows compliance balance and status for each ship
- Automatically refreshes when year changes

#### 3. **Compute CB** Tab
- Enter Ship ID, Year, and optional Route ID
- Click "Compute Compliance Balance"
- Calculates and saves compliance data
- Shows the computed result

### Features

✅ **Real-time Search**: Find any ship's compliance data instantly
✅ **Bulk View**: See all ships' compliance for a year at once
✅ **Auto-compute**: Calculate compliance from route data automatically
✅ **Status Indicators**: Visual badges show compliant/non-compliant status
✅ **Error Handling**: Clear error messages for missing data or invalid inputs

---

## Compliance Balance Interpretation

- **Positive CB (Surplus)**: Ship is compliant, has excess compliance credits
- **Negative CB (Deficit)**: Ship is non-compliant, needs to offset deficit
- **Zero CB (Neutral)**: Ship is exactly at the compliance target

---

## Workflow Example

1. **Compute Compliance** (POST `/api/ship-compliance/compute`)
   - Ship R002 needs compliance calculated
   - System looks up route R002 data
   - Calculates: (89.3368 - 88.2) × 6,000,000 = 6,808 gCO₂e
   - Saves to database

2. **View Individual Ship** (GET `/api/ship-compliance/R002/2024`)
   - Check R002's compliance status
   - See it has 6,808 gCO₂e surplus (compliant)

3. **View All Ships** (GET `/api/ship-compliance/year/2024`)
   - See all ships' compliance for 2024
   - Identify which ships need attention
   - Plan pooling or banking operations

---

## Integration with Other Features

- **Banking**: Ships with surplus can bank their credits
- **Pooling**: Ships can pool their compliance balances
- **Routes**: Compliance is calculated from route GHG intensity data

---

## Error Handling

All APIs provide clear error messages:
- **404**: Ship compliance not found (needs to be computed first)
- **400**: Invalid input (missing required fields)
- **500**: Server error (route doesn't exist, database error, etc.)

The frontend displays these errors in user-friendly toast notifications.

