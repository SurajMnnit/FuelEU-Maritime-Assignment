# Frontend-Backend Integration Guide

This document explains how the sea-fuel-guard frontend has been integrated with the Fuel EU Maritime backend.

## Integration Overview

The frontend (sea-fuel-guard-main) has been integrated with the backend API by:

1. **Replacing Mock Repositories with HTTP Adapters**: Created HTTP repository implementations that call the backend API
2. **Updating Vite Configuration**: Added proxy configuration to forward `/api` requests to the backend
3. **Domain Model Mapping**: Mapped backend domain models to frontend domain models
4. **Backend Enhancements**: Updated backend to track baseline routes

## File Structure

### Frontend Location
The frontend is located at: `frontend/sea-fuel-guard-main/`

### HTTP Adapters Created
- `frontend/sea-fuel-guard-main/src/adapters/infrastructure/api/HttpRouteRepository.ts`
- `frontend/sea-fuel-guard-main/src/adapters/infrastructure/api/HttpComplianceRepository.ts`
- `frontend/sea-fuel-guard-main/src/adapters/infrastructure/api/HttpPoolRepository.ts`

### Pages Updated
All pages now use HTTP repositories instead of mock repositories:
- `RoutesPage.tsx` - Uses `HttpRouteRepository`
- `ComparePage.tsx` - Uses `HttpRouteRepository`
- `BankingPage.tsx` - Uses `HttpComplianceRepository`
- `PoolingPage.tsx` - Uses `HttpComplianceRepository` and `HttpPoolRepository`

## API Endpoint Mapping

### Routes
- `GET /api/routes` → Get all routes
- `POST /api/routes/:routeId/baseline` → Set baseline for a route
- `GET /api/routes/comparison?routeId=xxx&year=YYYY` → Get comparison (used by frontend's comparison logic)

### Compliance
- `GET /api/compliance/cb?year=YYYY` → Get compliance balance
- `GET /api/compliance/adjusted-cb?year=YYYY` → Get adjusted compliance balance per ship

### Banking
- `POST /api/banking/bank` → Bank surplus
- `POST /api/banking/apply` → Apply banked surplus

### Pools
- `POST /api/pools` → Create pool

## Domain Model Differences

### Routes
- **Backend**: `Route` interface without `isBaseline` field
- **Frontend**: `Route` interface with optional `isBaseline` field
- **Solution**: Backend now adds `isBaseline` flag when returning routes

### Compliance Balance
- **Backend**: Uses `cb` field
- **Frontend**: Uses `complianceBalance` field
- **Solution**: HTTP adapter maps `cb` → `complianceBalance`

### Adjusted Compliance Balance
- **Backend**: Only has `shipId`, `year`, `adjustedCB`
- **Frontend**: Also expects `shipName`
- **Solution**: HTTP adapter generates `shipName` from `shipId`

## Running the Application

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:3001`

### 2. Start Frontend
```bash
cd frontend/sea-fuel-guard-main
npm install
npm run dev
```
Frontend runs on `http://localhost:8080`

The Vite proxy automatically forwards `/api/*` requests to the backend.

## Testing the Integration

1. **Routes Page**: 
   - View routes from backend
   - Set baseline for a route
   - Filter routes

2. **Compare Page**:
   - Select baseline and comparison years
   - View comparison charts and data

3. **Banking Page**:
   - View compliance balance
   - Bank surplus
   - Apply banked surplus

4. **Pooling Page**:
   - View adjusted compliance balances
   - Create pools with selected ships

## Known Limitations

1. **Pool Name**: Backend doesn't store pool names, but frontend requires them. The HTTP adapter handles this by using the name from the request.

2. **Ship Names**: Backend doesn't provide ship names, so the HTTP adapter generates them from ship IDs.

3. **Comparison Logic**: The frontend's comparison logic works with baseline routes by year, which may need refinement based on actual business requirements.

## Future Improvements

1. Add ship name storage in backend
2. Add pool name storage in backend
3. Add GET endpoints for pools (list all pools, get pool by ID)
4. Improve comparison endpoint to match frontend's year-based comparison
5. Add error handling and retry logic in HTTP adapters
6. Add loading states and better error messages

