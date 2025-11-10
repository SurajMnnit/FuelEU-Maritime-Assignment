# PostgreSQL Connection Setup Guide

## Step-by-Step Instructions

### Step 1: Verify PostgreSQL Installation

First, make sure PostgreSQL is installed and running:

```bash
# Check PostgreSQL version
psql --version

# On Windows, check if PostgreSQL service is running
# Open Services (services.msc) and look for "postgresql-x64-XX" service
```

### Step 2: Create the Database

Open a terminal/command prompt and run:

```bash
# Connect to PostgreSQL (you'll be prompted for password)
psql -U postgres

# Once connected, create the database
CREATE DATABASE fuel_eu_maritime;

# Verify it was created
\l

# Exit psql
\q
```

**Alternative (one command):**
```bash
# Windows PowerShell
createdb -U postgres fuel_eu_maritime

# Or with password prompt
psql -U postgres -c "CREATE DATABASE fuel_eu_maritime;"
```

### Step 3: Run the Database Schema

Navigate to your project directory and run the schema file:

```bash
# From the project root directory
cd "C:\Users\12shy\OneDrive\Desktop\FuelEU Maritime Project"

# Run the schema (you'll be prompted for password)
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql
```

**If you get a password prompt and want to avoid it:**

```bash
# Set PGPASSWORD environment variable (Windows PowerShell)
$env:PGPASSWORD="your_password"
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql
```

**Or use connection string:**
```bash
psql postgresql://postgres:your_password@localhost:5432/fuel_eu_maritime -f backend/database/schema.sql
```

### Step 4: Create Environment Configuration File

Create a `.env` file in the `backend` folder:

**File location:** `backend/.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fuel_eu_maritime
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# Server Configuration
PORT=3001
```

**Important:** Replace `your_actual_password_here` with your actual PostgreSQL password!

### Step 5: Verify Database Connection

Test the connection manually:

```bash
# Connect to your database
psql -U postgres -d fuel_eu_maritime

# Check if tables were created
\dt

# Check sample data
SELECT * FROM routes;

# Exit
\q
```

### Step 6: Start the Backend Server

```bash
cd backend
npm run dev
```

**You should see:**
```
🚀 Backend server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
💾 Database: PostgreSQL  ← This confirms PostgreSQL is being used!
✅ Database connected successfully
```

### Step 7: Test the API

Open your browser or use curl:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test routes endpoint
curl http://localhost:3001/api/routes
```

## Troubleshooting

### Problem: "psql: command not found"

**Solution:** Add PostgreSQL to your PATH:
- Windows: Add `C:\Program Files\PostgreSQL\XX\bin` to System PATH
- Or use full path: `"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres`

### Problem: "password authentication failed"

**Solution:** 
1. Check your password in `.env` file
2. Try resetting PostgreSQL password:
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'new_password';
   ```

### Problem: "database does not exist"

**Solution:** Create the database:
```bash
createdb -U postgres fuel_eu_maritime
```

### Problem: "connection refused" or "could not connect"

**Solution:**
1. Check if PostgreSQL service is running:
   - Windows: Open Services (services.msc), find PostgreSQL service, start it
2. Check if PostgreSQL is listening on port 5432:
   ```bash
   netstat -an | findstr 5432
   ```
3. Verify connection settings in `.env` file

### Problem: "relation does not exist" (tables not found)

**Solution:** Run the schema file again:
```bash
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql
```

### Problem: Server still shows "Mock (In-Memory)"

**Solution:**
1. Make sure `.env` file exists in `backend/` folder
2. Check that `DB_HOST` is set in `.env`
3. Restart the server (stop and start again)
4. Check for typos in environment variable names

## Quick Reference Commands

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
createdb -U postgres fuel_eu_maritime

# Run schema
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql

# List databases
psql -U postgres -c "\l"

# List tables
psql -U postgres -d fuel_eu_maritime -c "\dt"

# View routes table
psql -U postgres -d fuel_eu_maritime -c "SELECT * FROM routes;"

# Start backend
cd backend
npm run dev
```

## Verification Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `fuel_eu_maritime` is created
- [ ] Schema file has been executed successfully
- [ ] `.env` file exists in `backend/` folder
- [ ] `.env` file has correct database credentials
- [ ] Backend server starts without errors
- [ ] Server console shows "💾 Database: PostgreSQL"
- [ ] API endpoints return data (not empty arrays)

## Next Steps

Once connected:
1. Test all API endpoints
2. Verify data persistence (restart server, data should remain)
3. Check database tables using `psql` or pgAdmin
4. Start using the application with persistent data!

