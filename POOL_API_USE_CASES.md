# Pool API Use Cases

## Overview

The Pool APIs enable **Compliance Pooling**, a key mechanism in Fuel EU Maritime regulations that allows multiple ships to combine their compliance balances (CB) to meet regulatory requirements collectively.

## What is Compliance Pooling?

**Compliance Pooling** allows ship operators to:
- Combine compliance balances from multiple ships
- Share surplus compliance credits among pool members
- Offset deficits by using surplus from other ships in the pool
- Achieve collective compliance even if individual ships have deficits

### Business Context

In Fuel EU Maritime regulations:
- Each ship must maintain a compliance balance (CB)
- **Positive CB (Surplus)**: Ship is compliant, has excess credits
- **Negative CB (Deficit)**: Ship is non-compliant, needs to offset deficit
- **Pooling**: Ships can pool their CBs to achieve collective compliance

---

## API Endpoints

### 1. POST `/api/pools`
**Purpose**: Create a new compliance pool with multiple ships

**Use Case**: 
- Combine compliance balances from multiple ships
- Allow ships with deficits to benefit from ships with surpluses
- Achieve collective compliance for a group of ships

**How It Works**:
1. Takes a list of ship IDs and a year
2. Retrieves each ship's compliance balance (CB) for that year
3. Calculates the **pool sum** (sum of all CBs)
4. Validates that the pool sum is non-negative
5. Distributes the pool sum equally among all members
6. Saves the pool with before/after CB values

**Example Request**:
```json
POST /api/pools
Content-Type: application/json

{
  "year": 2024,
  "memberShipIds": ["R001", "R002", "R003"]
}
```

**Example Scenario**:
- Ship R001: CB = -10,000 gCO₂e (deficit)
- Ship R002: CB = +15,000 gCO₂e (surplus)
- Ship R003: CB = +5,000 gCO₂e (surplus)
- **Pool Sum**: -10,000 + 15,000 + 5,000 = **+10,000 gCO₂e**
- **After Pooling**: Each ship gets +10,000 / 3 = **+3,333 gCO₂e**

**Result**: All three ships become compliant through pooling!

**Response** (200 OK):
```json
{
  "poolId": "pool-1704067200000",
  "year": 2024,
  "members": [
    {
      "shipId": "R001",
      "adjustedCB": -10000,
      "cbBefore": -10000,
      "cbAfter": 3333.33
    },
    {
      "shipId": "R002",
      "adjustedCB": 15000,
      "cbBefore": 15000,
      "cbAfter": 3333.33
    },
    {
      "shipId": "R003",
      "adjustedCB": 5000,
      "cbBefore": 5000,
      "cbAfter": 3333.33
    }
  ],
  "poolSum": 10000,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Validation Rules**:
- ✅ Year must be a valid positive number
- ✅ `memberShipIds` must be a non-empty array
- ✅ All ship IDs must be non-empty strings
- ✅ All ships must have compliance data for the specified year
- ✅ Pool sum must be non-negative (cannot pool if total is negative)

**Error Responses**:
- `400`: Invalid input (missing fields, invalid types)
- `404`: Ship compliance data not found
- `500`: Pool sum is negative (cannot create pool)

---

### 2. GET `/api/pools`
**Purpose**: Retrieve all existing pools

**Use Case**:
- View all pools that have been created
- Track pooling history
- Audit compliance pooling activities
- Generate reports on pool usage

**Example Request**:
```
GET /api/pools
```

**Response** (200 OK):
```json
[
  {
    "poolId": "pool-1704067200000",
    "year": 2024,
    "members": [
      {
        "shipId": "R001",
        "adjustedCB": -10000,
        "cbBefore": -10000,
        "cbAfter": 3333.33
      },
      {
        "shipId": "R002",
        "adjustedCB": 15000,
        "cbBefore": 15000,
        "cbAfter": 3333.33
      }
    ],
    "poolSum": 10000,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "poolId": "pool-1704153600000",
    "year": 2024,
    "members": [
      {
        "shipId": "R004",
        "adjustedCB": 8000,
        "cbBefore": 8000,
        "cbAfter": 4000
      },
      {
        "shipId": "R005",
        "adjustedCB": 0,
        "cbBefore": 0,
        "cbAfter": 4000
      }
    ],
    "poolSum": 8000,
    "createdAt": "2024-01-02T00:00:00Z"
  }
]
```

**Error Responses**:
- `500`: Database schema issues (tables don't exist)

---

## Real-World Use Cases

### Use Case 1: Fleet Compliance Management
**Scenario**: A shipping company operates multiple vessels. Some ships exceed emissions targets (deficit), while others are below targets (surplus).

**Solution**: Create a pool with all company ships to balance compliance across the fleet.

**Example**:
```json
{
  "year": 2024,
  "memberShipIds": ["COMPANY-SHIP-001", "COMPANY-SHIP-002", "COMPANY-SHIP-003"]
}
```

### Use Case 2: Strategic Pooling
**Scenario**: Two ships need to pool to achieve compliance. One has a large surplus, the other has a deficit.

**Solution**: Create a pool with these two ships to share the surplus.

**Example**:
```json
{
  "year": 2024,
  "memberShipIds": ["R002", "R001"]  // R002 has surplus, R001 has deficit
}
```

### Use Case 3: Multi-Year Compliance Planning
**Scenario**: Track pools created across different years for compliance reporting.

**Solution**: Use GET `/api/pools` to retrieve all pools and generate compliance reports.

---

## Integration with Other Features

### Relationship with Ship Compliance
- Pools require ship compliance data to exist first
- Use POST `/api/ship-compliance/compute` to calculate CBs before pooling
- Pool members' CBs are retrieved from the `ship_compliance` table

### Relationship with Banking
- Ships can bank surplus before pooling
- Pooled CBs can be banked after pooling
- Banking and pooling are complementary compliance strategies

### Workflow Example

1. **Compute Ship Compliance** (POST `/api/ship-compliance/compute`)
   ```
   Ship R001: CB = -10,000 gCO₂e (deficit)
   Ship R002: CB = +15,000 gCO₂e (surplus)
   ```

2. **Create Pool** (POST `/api/pools`)
   ```json
   {
     "year": 2024,
     "memberShipIds": ["R001", "R002"]
   }
   ```
   Result: Both ships get +2,500 gCO₂e (pool sum: 5,000 / 2 ships)

3. **View All Pools** (GET `/api/pools`)
   - See all pools created
   - Track pooling history

---

## Business Rules

### Pool Creation Rules
1. ✅ **Minimum Ships**: At least one ship required (though typically 2+ for meaningful pooling)
2. ✅ **Non-Negative Sum**: Pool sum must be ≥ 0 (cannot pool if total is negative)
3. ✅ **Equal Distribution**: Pool sum is divided equally among all members
4. ✅ **Year-Specific**: Pools are created for a specific year
5. ✅ **Data Required**: All ships must have compliance data for the pool year

### Pool Calculation Formula
```
Pool Sum = Σ(CB of all member ships)
CB After Pooling = Pool Sum / Number of Members
```

**Example**:
- 3 ships with CBs: [-10,000, +15,000, +5,000]
- Pool Sum = 10,000
- CB After = 10,000 / 3 = 3,333.33 gCO₂e per ship

---

## Error Handling

The APIs provide comprehensive error handling:

- **Validation Errors** (400): Invalid input, missing required fields
- **Not Found** (404): Ship compliance data doesn't exist
- **Business Logic Errors** (500): Pool sum is negative, cannot create pool
- **Database Errors** (500): Schema issues, connection problems

All errors include helpful messages to guide users on how to fix issues.

---

## Frontend Integration

The frontend `PoolingPage` component uses these APIs to:
- Display available ships for pooling
- Allow users to select ships to include in a pool
- Show pool calculations (before/after CBs)
- Create pools with validation
- Display all existing pools

---

## Summary

**Pool APIs enable**:
- ✅ Collective compliance management
- ✅ Sharing surplus compliance credits
- ✅ Offsetting deficits through pooling
- ✅ Fleet-wide compliance optimization
- ✅ Compliance reporting and auditing

**Key Benefits**:
- Ships with deficits can become compliant
- Ships with surpluses can help others
- Fleet operators can optimize compliance across all vessels
- Regulatory compliance is achieved collectively