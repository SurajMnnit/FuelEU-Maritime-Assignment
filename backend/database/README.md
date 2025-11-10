# Database Setup Guide

## Quick Start

### PostgreSQL Database Setup

### 1. Install PostgreSQL

Download and install PostgreSQL from: https://www.postgresql.org/download/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fuel_eu_maritime;

# Exit
\q
```

### 3. Run Schema

```bash
# From the project root
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql
```

Or using the connection string:
```bash
psql postgresql://postgres:password@localhost:5432/fuel_eu_maritime -f backend/database/schema.sql
```

### 4. Configure Environment Variables

Create `backend/.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fuel_eu_maritime
DB_USER=postgres
DB_PASSWORD=your_password
```

### 5. Start the Server

```bash
cd backend
npm run dev
```

The server will use PostgreSQL for all database operations.

## Database Schema

The schema includes:

- **routes**: Vessel routes and emissions data
- **baselines**: Baseline emissions for comparison
- **compliance_balances**: Annual compliance balances
- **adjusted_compliance_balances**: Per-ship adjusted compliance balances
- **banking**: Banked surplus amounts
- **pools**: Compliance pools
- **pool_members**: Ships in each pool

See `schema.sql` for full table definitions and sample data.

## Troubleshooting

### Connection Errors

If you see connection errors:

1. **Check PostgreSQL is running**:
   ```bash
   # Windows
   services.msc (look for PostgreSQL service)
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Verify credentials** in `.env` file

3. **Check database exists**:
   ```bash
   psql -U postgres -l
   ```

4. **Test connection**:
   ```bash
   psql -U postgres -d fuel_eu_maritime
   ```

### Port Already in Use

If port 5432 is in use, change `DB_PORT` in `.env` file.

### Permission Errors

Make sure the database user has proper permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE fuel_eu_maritime TO postgres;
```

## Verification

When the server starts, check the console output:

- **PostgreSQL**: `💾 Database: PostgreSQL`

