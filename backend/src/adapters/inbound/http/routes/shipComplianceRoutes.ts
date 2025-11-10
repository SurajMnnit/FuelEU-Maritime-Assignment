/**
 * Ship Compliance Routes Module
 * 
 * This module defines all HTTP endpoints related to ship compliance balance operations,
 * including retrieving compliance balances per ship, computing compliance balances
 * from route data, and managing ship-specific compliance information.
 * 
 * @module routes/shipComplianceRoutes
 * @requires express
 * @requires ShipComplianceUseCase
 * @requires PostgresShipComplianceRepository
 */

import { Router, Request, Response } from 'express';
import { ShipComplianceUseCase } from '../../../../core/application/ShipComplianceUseCase';
import { PostgresShipComplianceRepository } from '../../../outbound/postgres/PostgresShipComplianceRepository';
import { ComputeCBRequest } from '../../../../core/domain/ShipCompliance';

const router = Router();

// Initialize repository and use case instances
// Using PostgreSQL repository for persistent data storage
const shipComplianceRepository = new PostgresShipComplianceRepository();
const shipComplianceUseCase = new ShipComplianceUseCase(shipComplianceRepository);

/**
 * GET /api/ship-compliance/year/:year
 * 
 * Retrieves all ship compliance balances for a given year.
 * 
 * IMPORTANT: This route must be defined BEFORE /ship-compliance/:shipId/:year
 * to avoid route conflicts, as Express matches routes in order and would
 * interpret "year" as a shipId if this route came after.
 * 
 * @route GET /api/ship-compliance/year/:year
 * @param {string} year - The year for which to retrieve ship compliance balances
 * @returns {Promise<ShipCompliance[]>} Array of all ship compliance balances for the year
 * @throws {400} Invalid year parameter
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * GET /api/ship-compliance/year/2024
 * 
 * // Response 200
 * [
 *   {
 *     "shipId": "R001",
 *     "year": 2024,
 *     "cbGco2eq": 50000
 *   }
 * ]
 */
router.get('/ship-compliance/year/:year', async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    
    if (!year) {
      return res.status(400).json({ error: 'year parameter is required' });
    }
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return res.status(400).json({ error: 'year must be a valid number' });
    }
    
    const complianceList = await shipComplianceUseCase.getAllShipCompliance(yearNum);
    res.json(complianceList);
  } catch (error: any) {
    console.error('Error fetching ship compliance list:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch ship compliance list',
      details: error.stack 
    });
  }
});

/**
 * GET /api/ship-compliance/:shipId/:year
 * 
 * Retrieves the compliance balance for a specific ship and year.
 * 
 * IMPORTANT: This route must be defined AFTER /ship-compliance/year/:year
 * to avoid route conflicts, as Express matches routes in order and would
 * interpret "year" as a shipId if this route came before.
 * 
 * @route GET /api/ship-compliance/:shipId/:year
 * @param {string} shipId - The unique identifier of the ship
 * @param {string} year - The year for which to retrieve compliance balance
 * @returns {Promise<ShipCompliance>} Ship compliance balance information
 * @throws {400} Invalid shipId or year parameter
 * @throws {404} Compliance balance not found for the specified ship and year
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * GET /api/ship-compliance/R001/2024
 * 
 * // Response 200
 * {
 *   "shipId": "R001",
 *   "year": 2024,
 *   "cbGco2eq": 50000
 * }
 */
router.get('/ship-compliance/:shipId/:year', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.params;
    
    if (!shipId || shipId.trim() === '') {
      return res.status(400).json({ error: 'shipId parameter is required' });
    }
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return res.status(400).json({ error: 'year must be a valid number' });
    }
    
    const compliance = await shipComplianceUseCase.getShipCompliance(shipId.trim(), yearNum);
    
    if (!compliance) {
      return res.status(404).json({ error: `Compliance balance not found for ship ${shipId} in year ${yearNum}` });
    }
    
    res.json(compliance);
  } catch (error: any) {
    console.error('Error fetching ship compliance:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch ship compliance',
      details: error.stack 
    });
  }
});

/**
 * POST /api/ship-compliance/compute
 * 
 * Computes and saves the compliance balance for a ship based on route data.
 * 
 * This endpoint calculates the compliance balance (CB) by comparing the ship's
 * route emissions against the regulatory target. The CB represents the difference
 * between the target emissions and actual emissions, where:
 * - Positive CB = Surplus (ship is compliant with excess credits)
 * - Negative CB = Deficit (ship is non-compliant and needs to offset)
 * 
 * The computed CB is saved to the database and can be used for banking and pooling operations.
 * 
 * @route POST /api/ship-compliance/compute
 * @param {Object} body - Compute CB request
 * @param {string} body.shipId - The unique identifier of the ship
 * @param {number} body.year - The year for which to compute compliance balance
 * @param {string} body.routeId - The route ID to use for computing compliance balance
 * @returns {Promise<ShipCompliance>} The computed and saved compliance balance
 * @throws {400} Invalid or missing request parameters
 * @throws {404} Route not found
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * POST /api/ship-compliance/compute
 * Content-Type: application/json
 * {
 *   "shipId": "R001",
 *   "year": 2024,
 *   "routeId": "R001"
 * }
 * 
 * // Response 200
 * {
 *   "shipId": "R001",
 *   "year": 2024,
 *   "cbGco2eq": 50000
 * }
 */
router.post('/ship-compliance/compute', async (req: Request, res: Response) => {
  try {
    // Log the incoming request for debugging
    console.log('Compute CB request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          shipId: 'SHIP001',
          year: 2023,
          routeId: 'R001'
        },
        received: {
          body: req.body,
          contentType: req.headers['content-type'],
          contentLength: req.headers['content-length']
        }
      });
    }
    
    const request: ComputeCBRequest = req.body;
    
    // Validate shipId
    if (!request.shipId || typeof request.shipId !== 'string' || request.shipId.trim() === '') {
      return res.status(400).json({ 
        error: 'shipId is required and must be a non-empty string',
        received: request.shipId,
        type: typeof request.shipId
      });
    }
    
    // Validate year
    if (request.year === undefined || request.year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: request.year,
        type: typeof request.year
      });
    }
    
    const yearNum = typeof request.year === 'string' ? parseInt(request.year) : request.year;
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json({ 
        error: 'year must be a valid positive number',
        received: request.year,
        parsed: yearNum
      });
    }
    
    // Validate routeId - if not provided, use shipId as routeId
    let routeId: string;
    if (request.routeId && typeof request.routeId === 'string' && request.routeId.trim() !== '') {
      routeId = request.routeId.trim();
    } else if (request.shipId && typeof request.shipId === 'string') {
      // If routeId is not provided, use shipId as routeId (common case where ship uses its route ID)
      routeId = request.shipId.trim();
      console.log(`⚠️  routeId not provided, using shipId as routeId: ${routeId}`);
    } else {
      return res.status(400).json({ 
        error: 'routeId is required. If not provided, shipId will be used as routeId',
        received: request.routeId,
        type: typeof request.routeId,
        hint: 'Either provide routeId in the request body, or ensure shipId matches a valid routeId'
      });
    }
    
    // Create validated request object
    const validatedRequest: ComputeCBRequest = {
      shipId: request.shipId.trim(),
      year: yearNum,
      routeId: routeId,
    };
    
    const compliance = await shipComplianceUseCase.computeComplianceBalance(validatedRequest);
    res.json(compliance);
  } catch (error: any) {
    console.error('Error computing ship compliance:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to compute ship compliance',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Export the router instance for use in the main server configuration
 * @exports router
 */
export default router;

