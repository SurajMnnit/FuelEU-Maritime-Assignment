# PowerShell script to run database schema
# This will create all necessary tables in the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Database Schema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to find PostgreSQL installation
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "✅ Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL not found in common locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please do one of the following:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Add PostgreSQL to PATH" -ForegroundColor Yellow
    Write-Host "  1. Find your PostgreSQL installation (usually C:\Program Files\PostgreSQL\XX\bin\)"
    Write-Host "  2. Add it to System PATH environment variable"
    Write-Host "  3. Restart PowerShell and run this script again"
    Write-Host ""
    Write-Host "Option 2: Use pgAdmin (GUI)" -ForegroundColor Yellow
    Write-Host "  1. Open pgAdmin"
    Write-Host "  2. Connect to your PostgreSQL server"
    Write-Host "  3. Right-click on 'fuel_eu_maritime' database"
    Write-Host "  4. Select 'Query Tool'"
    Write-Host "  5. Open file: backend\database\schema.sql"
    Write-Host "  6. Click 'Execute' (F5)"
    Write-Host ""
    Write-Host "Option 3: Run manually" -ForegroundColor Yellow
    Write-Host "  Replace XX with your PostgreSQL version:"
    Write-Host '  & "C:\Program Files\PostgreSQL\XX\bin\psql.exe" -U postgres -d fuel_eu_maritime -f backend\database\schema.sql'
    Write-Host ""
    exit 1
}

# Get schema file path
$schemaFile = Join-Path $PSScriptRoot "..\database\schema.sql"
$schemaFile = Resolve-Path $schemaFile -ErrorAction SilentlyContinue

if (-not $schemaFile) {
    Write-Host "❌ Schema file not found at: backend\database\schema.sql" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Schema file: $schemaFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running schema... You will be prompted for your PostgreSQL password." -ForegroundColor Yellow
Write-Host ""

# Run the schema
try {
    & $psqlPath -U postgres -d fuel_eu_maritime -f $schemaFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Schema executed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Run the test script: node test-db-connection.js" -ForegroundColor White
        Write-Host "  2. Start the server: npm run dev" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Schema execution failed. Check the error messages above." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running schema: $_" -ForegroundColor Red
    exit 1
}

