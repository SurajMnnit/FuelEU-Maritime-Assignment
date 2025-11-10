# How to Run Database Schema

The tables don't exist yet. You need to run the schema.sql file to create them.

## Method 1: Using the PowerShell Script (Easiest)

```powershell
cd backend
.\run-schema.ps1
```

This script will:
- Find your PostgreSQL installation
- Run the schema file
- Create all necessary tables

## Method 2: Using pgAdmin (GUI - Recommended if psql not in PATH)

1. **Open pgAdmin** (installed with PostgreSQL)

2. **Connect to your PostgreSQL server**
   - Enter your password when prompted

3. **Navigate to your database:**
   - Expand "Servers" → "PostgreSQL XX" → "Databases"
   - Right-click on `fuel_eu_maritime` database
   - Select **"Query Tool"**

4. **Open and run the schema:**
   - Click "Open File" button (folder icon)
   - Navigate to: `backend\database\schema.sql`
   - Click "Execute" button (or press F5)
   - Wait for "Query returned successfully" message

5. **Verify tables were created:**
   - In pgAdmin, expand `fuel_eu_maritime` → "Schemas" → "public" → "Tables"
   - You should see 7 tables:
     - adjusted_compliance_balances
     - banking
     - baselines
     - compliance_balances
     - pool_members
     - pools
     - routes

## Method 3: Manual Command Line

### Step 1: Find PostgreSQL Installation

PostgreSQL is usually installed at:
- `C:\Program Files\PostgreSQL\16\bin\psql.exe`
- `C:\Program Files\PostgreSQL\15\bin\psql.exe`
- etc.

### Step 2: Run the Schema

Replace `XX` with your PostgreSQL version number:

```powershell
# From project root
cd "C:\Users\12shy\OneDrive\Desktop\FuelEU Maritime Project"

# Run schema (replace XX with your version)
& "C:\Program Files\PostgreSQL\XX\bin\psql.exe" -U postgres -d fuel_eu_maritime -f backend\database\schema.sql
```

You'll be prompted for your PostgreSQL password.

### Step 3: Verify

After running, you should see output like:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
...
INSERT 0 5
```

## Method 4: Add PostgreSQL to PATH (One-time setup)

1. **Find PostgreSQL bin folder:**
   - Usually: `C:\Program Files\PostgreSQL\16\bin\`

2. **Add to PATH:**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to "Advanced" tab → "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit" → "New"
   - Add: `C:\Program Files\PostgreSQL\16\bin` (adjust version)
   - Click OK on all dialogs
   - **Restart PowerShell**

3. **Now you can use psql directly:**
   ```powershell
   psql -U postgres -d fuel_eu_maritime -f backend\database\schema.sql
   ```

## After Running Schema

Once the schema is executed successfully:

1. **Test the connection:**
   ```powershell
   cd backend
   node test-db-connection.js
   ```

2. **You should now see:**
   ```
   ✅ Found 7 table(s)
   ✅ Routes table has 5 record(s)
   🎉 All tests passed!
   ```

3. **Start the server:**
   ```powershell
   npm run dev
   ```

## Troubleshooting

### "psql: command not found"
- Use Method 2 (pgAdmin) or Method 3 (full path)
- Or add PostgreSQL to PATH (Method 4)

### "password authentication failed"
- Check your PostgreSQL password
- Make sure you're using the correct username (usually `postgres`)

### "database does not exist"
- Create it first:
  ```powershell
  createdb -U postgres fuel_eu_maritime
  ```
  Or in pgAdmin: Right-click "Databases" → Create → Database

### "permission denied"
- Make sure you're using the `postgres` superuser account
- Or ensure your user has CREATE privileges

## Quick Check

After running schema, verify tables exist:

```powershell
# Using psql
psql -U postgres -d fuel_eu_maritime -c "\dt"

# Or in pgAdmin: Expand database → Schemas → public → Tables
```

You should see 7 tables listed.

