/**
 * Route Routes Module
 * 
 * This module defines all HTTP endpoints related to route management,
 * including route retrieval, baseline management, and route comparison.
 * 
 * @module routes/routeRoutes
 * @requires express
 * @requires RouteUseCase
 * @requires PostgresRouteRepository
 */

import { Router, Request, Response } from 'express';
import { RouteUseCase } from '../../../../core/application/RouteUseCase';
import { PostgresRouteRepository } from '../../../outbound/postgres/PostgresRouteRepository';
import { Baseline } from '../../../../core/domain/Route';

const router = Router();

// Initialize repository and use case instances
// Using PostgreSQL repository for persistent data storage
const routeRepository = new PostgresRouteRepository();
const routeUseCase = new RouteUseCase(routeRepository);

/**
 * GET /api/routes
 * 
 * Retrieves all vessel routes from the database.
 * 
 * @route GET /api/routes
 * @returns {Promise<Route[]>} Array of all routes
 * @throws {500} Internal server error if route retrieval fails
 * 
 * @example
 * // Request
 * GET /api/routes
 * 
 * // Response 200
 * [
 *   {
 *     "routeId": "R001",
 *     "vesselType": "Container Ship",
 *     "fuelType": "HFO",
 *     "year": 2024,
 *     "ghgIntensity": 91.5,
 *     "fuelConsumption": 5000000,
 *     "distance": 1200,
 *     "totalEmissions": 457500000,
 *     "isBaseline": false
 *   }
 * ]
 */
router.get('/routes', async (req: Request, res: Response) => {
  try {
    const routes = await routeUseCase.getAllRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

/**
 * POST /api/routes/:routeId/baseline
 * 
 * Sets a route as the baseline for comparison purposes. The baseline route
 * serves as a reference point for comparing other routes' emissions and performance.
 * 
 * The request body can override route data, but if not provided, existing route
 * data will be used. All required fields must be present.
 * 
 * @route POST /api/routes/:routeId/baseline
 * @param {string} routeId - The unique identifier of the route to set as baseline
 * @param {Object} body - Optional baseline data to override route values
 * @param {number} [body.year] - Year of the baseline (defaults to route year)
 * @param {number} [body.ghgIntensity] - GHG intensity in gCO₂e/MJ (defaults to route value)
 * @param {number} [body.fuelConsumption] - Fuel consumption in MJ (defaults to route value)
 * @param {number} [body.distance] - Distance in nautical miles (defaults to route value)
 * @param {number} [body.totalEmissions] - Total emissions in gCO₂e (defaults to route value)
 * @returns {Promise<Baseline>} The saved baseline data
 * @throws {404} Route not found
 * @throws {400} Missing required fields
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * POST /api/routes/R001/baseline
 * Content-Type: application/json
 * {
 *   "year": 2024,
 *   "ghgIntensity": 85.5,
 *   "fuelConsumption": 5000000,
 *   "distance": 1200,
 *   "totalEmissions": 427500000
 * }
 * 
 * // Response 200
 * {
 *   "routeId": "R001",
 *   "year": 2024,
 *   "ghgIntensity": 85.5,
 *   "fuelConsumption": 5000000,
 *   "distance": 1200,
 *   "totalEmissions": 427500000
 * }
 */
router.post('/routes/:routeId/baseline', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    
    // Verify route exists before setting as baseline
    // This ensures we have all required data for baseline creation
    const existingRoute = await routeRepository.findByRouteId(routeId);
    
    if (!existingRoute) {
      return res.status(404).json({ error: `Route ${routeId} not found` });
    }
    
    // Create baseline object with route data as defaults
    // Request body values override existing route data if provided
    const baseline: Baseline = {
      routeId,
      year: req.body.year || existingRoute.year,
      ghgIntensity: req.body.ghgIntensity || existingRoute.ghgIntensity,
      fuelConsumption: req.body.fuelConsumption || existingRoute.fuelConsumption,
      distance: req.body.distance || existingRoute.distance,
      totalEmissions: req.body.totalEmissions || existingRoute.totalEmissions,
    };
    
    // Validate that all required fields are present
    // All fields must have valid values (not undefined, null, or empty)
    if (!baseline.year || baseline.ghgIntensity === undefined || baseline.fuelConsumption === undefined || 
        baseline.distance === undefined || baseline.totalEmissions === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields. Provide year, ghgIntensity, fuelConsumption, distance, and totalEmissions' 
      });
    }
    
    // Save baseline and return the saved data
    const savedBaseline = await routeUseCase.setBaseline(routeId, baseline);
    res.json(savedBaseline);
  } catch (error: any) {
    console.error('Error setting baseline:', error);
    res.status(500).json({ error: error.message || 'Failed to set baseline' });
  }
});

/**
 * GET /api/routes/comparison
 * 
 * Retrieves comparison data between routes and their baseline.
 * Supports two modes:
 * 1. Single route comparison: Provide routeId and year query parameters
 * 2. All routes comparison: Omit routeId to compare all routes with baseline
 * 
 * The comparison includes:
 * - Baseline route data
 * - Current route data
 * - Percent difference in GHG intensity
 * - Compliance status against regulatory target (89.3368 gCO₂e/MJ)
 * 
 * @route GET /api/routes/comparison
 * @param {string} [query.routeId] - Optional route ID for single route comparison
 * @param {string} [query.year] - Optional year filter (required if routeId is provided)
 * @returns {Promise<ComparisonData|ComparisonData[]>} Single comparison or array of comparisons
 * @throws {400} Invalid year parameter or missing year when routeId provided
 * @throws {500} Internal server error
 * 
 * @example
 * // Single route comparison
 * GET /api/routes/comparison?routeId=R001&year=2024
 * 
 * // Response 200
 * {
 *   "baseline": { ... },
 *   "comparison": { ... },
 *   "percentDifference": 5.2,
 *   "complianceTarget": 89.3368,
 *   "isCompliant": true
 * }
 * 
 * @example
 * // All routes comparison
 * GET /api/routes/comparison?year=2024
 * 
 * // Response 200
 * [
 *   { "baseline": { ... }, "comparison": { ... }, ... },
 *   { "baseline": { ... }, "comparison": { ... }, ... }
 * ]
 */
router.get('/routes/comparison', async (req: Request, res: Response) => {
  try {
    const routeId = req.query.routeId as string;
    const year = req.query.year as string;
    
    // Mode 1: Single route comparison (backward compatibility)
    // If routeId is provided, compare only that specific route
    if (routeId && routeId.trim() !== '') {
      // Year is required for single route comparison
      if (!year || year.trim() === '') {
        return res.status(400).json({ 
          error: 'year query parameter is required when routeId is provided',
          example: '/api/routes/comparison?routeId=R001&year=2024'
        });
      }
      
      // Validate and parse year parameter
      const yearNum = parseInt(year.trim());
      if (isNaN(yearNum)) {
        return res.status(400).json({ 
          error: 'year must be a valid number',
          received: year
        });
      }
      
      // Get comparison for single route
      const comparison = await routeUseCase.getComparison(
        routeId.trim(),
        yearNum
      );
      return res.json(comparison);
    }
    
    // Mode 2: All routes comparison
    // If no routeId, compare all routes with baseline
    // Year is optional - if provided, filter routes by year
    const yearNum = year ? parseInt(year.trim()) : undefined;
    if (year && isNaN(yearNum!)) {
      return res.status(400).json({ 
        error: 'year must be a valid number',
        received: year
      });
    }
    
    // Get comparisons for all routes (optionally filtered by year)
    const comparisons = await routeUseCase.getAllComparisons(yearNum);
    res.json(comparisons);
  } catch (error: any) {
    console.error('Error getting comparison:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get comparison',
      details: error.stack
    });
  }
});

/**
 * Export the router instance for use in the main server configuration
 * @exports router
 */
export default router;