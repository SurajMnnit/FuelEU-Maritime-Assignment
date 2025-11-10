# API Testing Guide

## Quick Start

### Run All API Tests

```bash
cd backend
npm run test:api
```

This will test all endpoints automatically.

## What Gets Tested

### 1. Health Check
- ✅ GET `/health` - Server health status

### 2. Routes API
- ✅ GET `/api/routes` - Get all routes
- ✅ POST `/api/routes/:routeId/baseline` - Set baseline
- ✅ GET `/api/routes/comparison` - Get comparison data
- ✅ Validation of required fields
- ✅ Response structure validation

### 3. Compliance API
- ✅ GET `/api/compliance/cb` - Get compliance balance
- ✅ GET `/api/compliance/adjusted-cb` - Get adjusted compliance balances
- ✅ Parameter validation (year required)
- ✅ Response structure validation

### 4. Banking API
- ✅ POST `/api/banking/bank` - Bank surplus
- ✅ POST `/api/banking/apply` - Apply banked surplus
- ✅ Required field validation
- ✅ Response structure validation

### 5. Pools API
- ✅ POST `/api/pools` - Create pool
- ✅ Required field validation
- ✅ Empty array validation

## Test Output

The test suite provides:
- ✅ **Green checkmarks** for passed tests
- ❌ **Red X marks** for failed tests
- 📊 **Summary** with pass rate
- 💬 **Detailed messages** for each test

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║     Fuel EU Maritime API Test Suite                        ║
╚════════════════════════════════════════════════════════════╝

Testing API at: http://localhost:3001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HEALTH CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Testing: Health endpoint returns 200... ✓ PASSED
   Status: ok

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ROUTES API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Testing: GET /api/routes - Returns array of routes... ✓ PASSED
   Found 5 route(s)

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Tests: 15
Passed: 15
Failed: 0
Pass Rate: 100.0%

🎉 All tests passed!
```

## Prerequisites

1. **Backend server must be running:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Server should be on:** `http://localhost:3001` (default)

   To test a different URL, set environment variable:
   ```bash
   API_URL=http://localhost:3001 npm run test:api
   ```

## Running Individual Test Sections

The test suite runs all tests automatically. To test specific endpoints manually:

### Test Routes API
```bash
curl http://localhost:3001/api/routes
```

### Test Compliance API
```bash
curl http://localhost:3001/api/compliance/cb?year=2024
```

### Test Banking API
```bash
curl -X POST http://localhost:3001/api/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "amount": 100000}'
```

### Test Pools API
```bash
curl -X POST http://localhost:3001/api/pools \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "memberShipIds": ["ship-001", "ship-003"]}'
```

## Understanding Test Results

### ✅ Passed Tests
- Endpoint is accessible
- Returns expected status code
- Response structure is correct
- Data validation passes

### ❌ Failed Tests

Common failure reasons:

1. **Server not running**
   - Error: "Cannot connect to server"
   - Solution: Start backend with `npm run dev`

2. **Wrong status code**
   - Expected 200, got 500
   - Check server logs for errors
   - Verify database connection

3. **Missing fields**
   - Response doesn't have expected properties
   - Check API implementation
   - Verify database has data

4. **Validation errors**
   - Required parameters missing
   - Invalid data format
   - Check request payload

## Customizing Tests

### Change Test Data

Edit `backend/test-api.js`:

```javascript
let testRouteId = 'route-001';  // Change this
let testYear = 2024;            // Change this
```

### Add New Tests

Add test cases in the appropriate section:

```javascript
await test('Your test name', async () => {
  const response = await makeRequest('GET', '/your-endpoint');
  expect(response.status).toBe(200);
  // Your assertions
  return { passed: true, message: 'Your message' };
});
```

## Continuous Testing

### Watch Mode (Manual)

Run tests after code changes:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm run test:api
```

### Integration with CI/CD

The test script exits with:
- **Code 0**: All tests passed
- **Code 1**: Some tests failed

This makes it suitable for CI/CD pipelines.

## Troubleshooting

### "Cannot connect to server"
- ✅ Make sure backend is running: `npm run dev`
- ✅ Check if port 3001 is correct
- ✅ Verify no firewall blocking

### "All tests failing"
- ✅ Check server logs for errors
- ✅ Verify database connection
- ✅ Check if database has data

### "Some tests failing"
- ✅ Read the error messages
- ✅ Check which endpoint failed
- ✅ Verify that endpoint manually with curl

## Test Coverage

The test suite covers:
- ✅ All CRUD operations
- ✅ Input validation
- ✅ Error handling
- ✅ Response structure
- ✅ Status codes
- ✅ Required fields

## Next Steps

After running tests:
1. Fix any failing tests
2. Verify manually if needed
3. Check server logs for errors
4. Ensure database has test data

## Related Commands

```bash
# Test database connection
npm run test:db

# Test API endpoints
npm run test:api

# Start development server
npm run dev
```

