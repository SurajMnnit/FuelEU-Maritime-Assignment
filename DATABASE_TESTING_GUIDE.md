# Database Connection Testing Guide

## Quick Test Methods

### Method 1: Test Script (Recommended)

Run the automated test script:

```bash
cd backend
node test-db-connection.js
```

**What it tests:**
- ✅ Basic database connection
- ✅ PostgreSQL version
- ✅ Table existence
- ✅ Sample data retrieval
- ✅ Data integrity

**Expected Output (Success):**
```
🔍 Testing PostgreSQL Database Connection...

Configuration:
  Host: localhost
  Port: 5432
  Database: fuel_eu_maritime
  User: postgres
  Password: ***

Test 1: Testing basic connection...
✅ Connection successful!

Test 2: Checking PostgreSQL version...
✅ PostgreSQL Version: PostgreSQL 16.x

Test 3: Checking if tables exist...
✅ Found 7 table(s):
   - adjusted_compliance_balances
   - banking
   - baselines
   - compliance_balances
   - pool_members
   - pools
   - routes

Test 4: Checking routes table...
✅ Routes table has 5 record(s)

Test 5: Fetching sample route data...
✅ Sample data:
   - route-001: Container Ship (2024)
   - route-002: Bulk Carrier (2024)
   - route-003: Tanker (2024)

🎉 All tests passed! Database is working correctly.
```

### Method 2: Check Backend Server Logs

Start your backend server:

```bash
cd backend
npm run dev
```

**Look for these indicators:**

✅ **Success:**
```
🚀 Backend server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
💾 Database: PostgreSQL
✅ Database connected successfully
```

❌ **Using Mock (Database not connected):**
```
💾 Database: Mock (In-Memory)
```

### Method 3: Test API Endpoints

#### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Test 2: Get Routes
```bash
curl http://localhost:3001/api/routes
```

**If database is working:**
- Returns data from PostgreSQL
- Data persists after server restart

**If using mock:**
- Returns mock data
- Data resets on server restart

#### Test 3: Get Compliance Balance
```bash
curl http://localhost:3001/api/compliance/cb?year=2024
```

Expected response:
```json
{
  "year": 2024,
  "cb": 1500000
}
```

### Method 4: Direct Database Query

Connect to PostgreSQL directly:

```bash
psql -U postgres -d fuel_eu_maritime
```

Then run these queries:

```sql
-- Check connection
SELECT version();

-- List all tables
\dt

-- Count routes
SELECT COUNT(*) FROM routes;

-- View sample routes
SELECT route_id, vessel_type, year FROM routes LIMIT 5;

-- Check compliance balances
SELECT * FROM compliance_balances;

-- Exit
\q
```

### Method 5: Browser Test

1. Start backend: `npm run dev`
2. Open browser: `http://localhost:3001/api/routes`
3. You should see JSON data with routes

## Troubleshooting Test Results

### ❌ "Database: Mock (In-Memory)"

**Problem:** Backend is not detecting PostgreSQL

**Solutions:**
1. Check if `.env` file exists in `backend/` folder
2. Verify `DB_HOST` is set in `.env`:
   ```env
   DB_HOST=localhost
   ```
3. Restart the server after changing `.env`
4. Check for typos in environment variable names

### ❌ "Connection refused" or "ECONNREFUSED"

**Problem:** Cannot connect to PostgreSQL server

**Solutions:**
1. **Check PostgreSQL service is running:**
   - Windows: Open Services (`services.msc`)
   - Look for "postgresql-x64-XX" service
   - Right-click → Start (if stopped)

2. **Verify port:**
   ```bash
   netstat -an | findstr 5432
   ```
   Should show PostgreSQL listening

3. **Check firewall:** Allow port 5432

### ❌ "password authentication failed"

**Problem:** Wrong credentials

**Solutions:**
1. Check `.env` file for correct password
2. Test password manually:
   ```bash
   psql -U postgres -d fuel_eu_maritime
   ```
3. Reset password if needed:
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### ❌ "database does not exist" or "3D000"

**Problem:** Database not created

**Solution:**
```bash
createdb -U postgres fuel_eu_maritime
```

### ❌ "relation does not exist" or "42P01"

**Problem:** Tables not created

**Solution:**
```bash
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql
```

### ❌ "No tables found" in test script

**Problem:** Schema not run

**Solution:**
```bash
cd backend
psql -U postgres -d fuel_eu_maritime -f database/schema.sql
```

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] PostgreSQL service is running
- [ ] Database `fuel_eu_maritime` exists
- [ ] Schema has been executed (tables exist)
- [ ] `.env` file exists in `backend/` folder
- [ ] `.env` file has correct credentials
- [ ] Test script passes all tests
- [ ] Backend server shows "Database: PostgreSQL"
- [ ] API endpoints return data
- [ ] Data persists after server restart

## Quick Test Commands

```bash
# 1. Test connection script
cd backend
node test-db-connection.js

# 2. Start server and check logs
npm run dev

# 3. Test API (in another terminal)
curl http://localhost:3001/api/routes

# 4. Direct database test
psql -U postgres -d fuel_eu_maritime -c "SELECT COUNT(*) FROM routes;"
```

## Success Indicators

✅ **Database is working if:**
- Test script shows all green checkmarks
- Server logs show "Database: PostgreSQL"
- API endpoints return data
- Data persists after restarting server
- You can query database directly with psql

❌ **Database is NOT working if:**
- Server shows "Database: Mock (In-Memory)"
- Test script shows connection errors
- API returns empty arrays (and you know data should exist)
- Data resets when server restarts

## Need Help?

If tests fail, check:
1. `POSTGRESQL_SETUP_GUIDE.md` - Setup instructions
2. `DATABASE_INTEGRATION.md` - Integration details
3. Server console logs for specific error messages

