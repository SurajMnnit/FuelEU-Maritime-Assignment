# Database Integration Guide

## Current State: Mock In-Memory Storage

**Important**: The current implementation does **NOT** use a real database. Instead, it uses **mock repositories** with in-memory data storage (JavaScript Maps and Arrays).

### Current Architecture

The backend follows **Hexagonal Architecture** (Ports & Adapters), which makes it easy to swap mock repositories for real database implementations.

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Routes (Express)                 │
│              (routeRoutes.ts, complianceRoutes.ts)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Use Cases (Business Logic)                  │
│         (RouteUseCase, ComplianceUseCase, etc.)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Ports (Interfaces)                          │
│    (RouteRepository, ComplianceRepository, etc.)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Adapters (Current: Mock Repositories)            │
│  (MockRouteRepository, MockComplianceRepository, etc.)  │
│                                                          │
│  Data Storage:                                          │
│  - JavaScript Arrays (mockRoutes)                       │
│  - JavaScript Maps (baselines, complianceBalances)      │
│  - JavaScript Sets (baselineRouteIds)                   │
└─────────────────────────────────────────────────────────┘
```

### Current Mock Repositories

1. **MockRouteRepository** (`backend/src/adapters/persistence/MockRouteRepository.ts`)
   - Stores routes in a JavaScript array
   - Stores baselines in a JavaScript Map
   - Data is lost when server restarts

2. **MockComplianceRepository** (`backend/src/adapters/persistence/MockComplianceRepository.ts`)
   - Stores compliance balances in a JavaScript Map
   - Stores adjusted CBs in a JavaScript Map

3. **MockBankingRepository** (`backend/src/adapters/persistence/MockBankingRepository.ts`)
   - Stores banking data in JavaScript Maps

4. **MockPoolRepository** (`backend/src/adapters/persistence/MockPoolRepository.ts`)
   - Stores pools in a JavaScript array

### How It Works Currently

```typescript
// Example: MockRouteRepository
const mockRoutes: Route[] = [
  { routeId: 'route-001', vesselType: 'Container Ship', ... },
  { routeId: 'route-002', vesselType: 'Bulk Carrier', ... },
];

const baselines: Map<string, Baseline> = new Map();

export class MockRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    return [...mockRoutes]; // Returns in-memory array
  }
  
  async saveBaseline(routeId: string, baseline: Baseline): Promise<Baseline> {
    baselines.set(`${routeId}-${baseline.year}`, baseline); // Stores in Map
    return baseline;
  }
}
```

**Limitations:**
- ❌ Data is lost when server restarts
- ❌ No data persistence
- ❌ No concurrent access handling
- ❌ No transactions
- ❌ No data validation at storage level

---

## How to Integrate a Real Database (PostgreSQL Example)

The architecture is designed to make database integration simple. You only need to:

1. **Create a new PostgreSQL repository** that implements the same interface
2. **Replace the mock repository** in the route files
3. **Add database connection and query logic**

### Step 1: Install PostgreSQL Dependencies

```bash
cd backend
npm install pg
npm install --save-dev @types/pg
```

### Step 2: Create Database Connection

Create `backend/src/adapters/persistence/database/connection.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fuel_eu_maritime',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### Step 3: Create PostgreSQL Route Repository

Create `backend/src/adapters/persistence/PostgresRouteRepository.ts`:

```typescript
import { Route, Baseline } from '../../core/domain/Route';
import { RouteRepository } from '../../core/ports/RouteRepository';
import pool from './database/connection';

export class PostgresRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    const result = await pool.query(`
      SELECT 
        route_id as "routeId",
        vessel_type as "vesselType",
        fuel_type as "fuelType",
        year,
        ghg_intensity as "ghgIntensity",
        fuel_consumption as "fuelConsumption",
        distance,
        total_emissions as "totalEmissions",
        is_baseline as "isBaseline"
      FROM routes
      ORDER BY year DESC, route_id
    `);
    return result.rows;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const result = await pool.query(
      `SELECT * FROM routes WHERE route_id = $1`,
      [routeId]
    );
    return result.rows[0] || null;
  }

  async saveBaseline(routeId: string, baseline: Baseline): Promise<Baseline> {
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update route to mark as baseline
      await client.query(
        `UPDATE routes SET is_baseline = true WHERE route_id = $1`,
        [routeId]
      );

      // Save baseline record
      await client.query(
        `INSERT INTO baselines (route_id, year, ghg_intensity, fuel_consumption, distance, total_emissions)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (route_id, year) 
         DO UPDATE SET 
           ghg_intensity = EXCLUDED.ghg_intensity,
           fuel_consumption = EXCLUDED.fuel_consumption,
           distance = EXCLUDED.distance,
           total_emissions = EXCLUDED.total_emissions`,
        [
          baseline.routeId,
          baseline.year,
          baseline.ghgIntensity,
          baseline.fuelConsumption,
          baseline.distance,
          baseline.totalEmissions,
        ]
      );

      await client.query('COMMIT');
      return baseline;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findBaseline(routeId: string, year: number): Promise<Baseline | null> {
    const result = await pool.query(
      `SELECT * FROM baselines WHERE route_id = $1 AND year = $2`,
      [routeId, year]
    );
    return result.rows[0] || null;
  }
}
```

### Step 4: Update Route Routes to Use PostgreSQL

Update `backend/src/adapters/http/routes/routeRoutes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { RouteUseCase } from '../../../core/application/RouteUseCase';
// Change this line:
// import { MockRouteRepository } from '../../persistence/MockRouteRepository';
import { PostgresRouteRepository } from '../../persistence/PostgresRouteRepository';
import { Baseline } from '../../../core/domain/Route';

const router = Router();
// Change this line:
// const routeRepository = new MockRouteRepository();
const routeRepository = new PostgresRouteRepository();
const routeUseCase = new RouteUseCase(routeRepository);

// ... rest of the code remains the same
```

### Step 5: Create Database Schema

Create `backend/database/schema.sql`:

```sql
-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  route_id VARCHAR(50) PRIMARY KEY,
  vessel_type VARCHAR(100) NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity DECIMAL(10, 2) NOT NULL,
  fuel_consumption DECIMAL(15, 2) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  total_emissions DECIMAL(15, 2) NOT NULL,
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Baselines table
CREATE TABLE IF NOT EXISTS baselines (
  route_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity DECIMAL(10, 2) NOT NULL,
  fuel_consumption DECIMAL(15, 2) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  total_emissions DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id, year),
  FOREIGN KEY (route_id) REFERENCES routes(route_id)
);

-- Compliance balances table
CREATE TABLE IF NOT EXISTS compliance_balances (
  year INTEGER PRIMARY KEY,
  cb DECIMAL(15, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adjusted compliance balances table
CREATE TABLE IF NOT EXISTS adjusted_compliance_balances (
  ship_id VARCHAR(50) PRIMARY KEY,
  year INTEGER NOT NULL,
  adjusted_cb DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banking table
CREATE TABLE IF NOT EXISTS banking (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  banked_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
  pool_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  year INTEGER NOT NULL,
  total_cb DECIMAL(15, 2) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool members table
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id VARCHAR(50) NOT NULL,
  ship_id VARCHAR(50) NOT NULL,
  cb_before_pool DECIMAL(15, 2) NOT NULL,
  cb_after_pool DECIMAL(15, 2) NOT NULL,
  PRIMARY KEY (pool_id, ship_id),
  FOREIGN KEY (pool_id) REFERENCES pools(pool_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_routes_year ON routes(year);
CREATE INDEX IF NOT EXISTS idx_routes_vessel_type ON routes(vessel_type);
CREATE INDEX IF NOT EXISTS idx_baselines_route_year ON baselines(route_id, year);
```

### Step 6: Add Environment Variables

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fuel_eu_maritime
DB_USER=postgres
DB_PASSWORD=your_password
```

### Step 7: Update package.json

Add dotenv loading in `backend/src/index.ts`:

```typescript
import 'dotenv/config'; // Add this at the top
import express from 'express';
// ... rest of the code
```

---

## Summary: Current vs. Database Integration

| Aspect | Current (Mock) | With PostgreSQL |
|--------|---------------|-----------------|
| **Storage** | In-memory (Arrays, Maps) | PostgreSQL database |
| **Persistence** | ❌ Lost on restart | ✅ Persistent |
| **Concurrency** | ❌ No handling | ✅ ACID transactions |
| **Scalability** | ❌ Single instance | ✅ Multi-instance ready |
| **Data Integrity** | ❌ No validation | ✅ Database constraints |
| **Query Performance** | ⚠️ O(n) array search | ✅ Indexed queries |
| **Setup Complexity** | ✅ Simple | ⚠️ Requires DB setup |

---

## Key Benefits of Hexagonal Architecture

1. **Easy Swapping**: Change one line to switch from mock to database
2. **Testability**: Use mocks for unit tests, database for integration tests
3. **Flexibility**: Can support multiple databases (PostgreSQL, MySQL, MongoDB)
4. **No Business Logic Changes**: Use cases remain unchanged

---

## Next Steps

1. **For Development**: Continue using mock repositories (current setup)
2. **For Production**: 
   - Set up PostgreSQL database
   - Create database schema
   - Implement PostgreSQL repositories
   - Update route files to use PostgreSQL repositories
   - Add database migrations (consider using TypeORM, Prisma, or Knex.js)

---

## Alternative: Using an ORM

For easier database management, consider using an ORM:

- **TypeORM**: TypeScript-first ORM
- **Prisma**: Modern database toolkit
- **Sequelize**: Mature Node.js ORM

These tools can generate repositories automatically and handle migrations.

