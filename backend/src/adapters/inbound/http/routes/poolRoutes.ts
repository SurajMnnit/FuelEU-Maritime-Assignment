/**
 * Pool Routes Module
 * 
 * This module defines all HTTP endpoints related to compliance pool management,
 * including pool creation with Article 21 validation and pool retrieval.
 * 
 * Compliance pooling allows multiple ships to combine their compliance balances
 * to meet regulatory requirements collectively, following Fuel EU Maritime Article 21 rules.
 * 
 * @module routes/poolRoutes
 * @requires express
 * @requires PoolUseCase
 * @requires PostgresPoolRepository
 * @requires PostgresShipComplianceRepository
 */

import { Router, Request, Response } from 'express';
import { PoolUseCase } from '../../../../core/application/PoolUseCase';
import { PostgresPoolRepository } from '../../../outbound/postgres/PostgresPoolRepository';
import { PostgresShipComplianceRepository } from '../../../outbound/postgres/PostgresShipComplianceRepository';
import { CreatePoolRequest } from '../../../../core/domain/Pool';

const router = Router();

// Initialize repositories and use case instances
// Using PostgreSQL repositories for persistent data storage
const poolRepository = new PostgresPoolRepository();
const shipComplianceRepository = new PostgresShipComplianceRepository();
const poolUseCase = new PoolUseCase(poolRepository, shipComplianceRepository);

/**
 * POST /api/pools
 * 
 * Creates a new compliance pool with the specified member ships.
 * 
 * This endpoint implements Article 21 pooling rules:
 * - Sum of adjusted CBs must be >= 0 (pool must be collectively compliant)
 * - Deficit ships cannot exit worse than they entered (cbAfter >= cbBefore)
 * - Surplus ships cannot exit negative (cbAfter >= 0)
 * 
 * The pool sum is distributed equally among all members, and each member's
 * before/after compliance balance is tracked.
 * 
 * @route POST /api/pools
 * @param {Object} body - Pool creation request
 * @param {string} [body.name] - Optional name for the pool
 * @param {number} body.year - The year for which to create the pool
 * @param {string[]} body.memberShipIds - Array of ship IDs to include in the pool
 * @returns {Promise<Pool>} The created pool with all member data
 * @throws {400} Invalid or missing request parameters
 * @throws {500} Internal server error or validation failure
 * 
 * @example
 * // Request
 * POST /api/pools
 * Content-Type: application/json
 * {
 *   "name": "Strategic Pool 2024",
 *   "year": 2024,
 *   "memberShipIds": ["R001", "R002", "R003"]
 * }
 * 
 * // Response 200
 * {
 *   "poolId": "pool-1234567890",
 *   "name": "Strategic Pool 2024",
 *   "year": 2024,
 *   "members": [
 *     {
 *       "shipId": "R001",
 *       "adjustedCB": -50000,
 *       "cbBefore": -50000,
 *       "cbAfter": 0
 *     }
 *   ],
 *   "poolSum": 0,
 *   "createdAt": "2024-01-15T10:30:00Z"
 * }
 */
router.post('/pools', async (req: Request, res: Response) => {
  try {
    // Log request for debugging
    console.log('Create pool request body:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          year: 2024,
          memberShipIds: ['SHIP001', 'SHIP002']
        }
      });
    }
    
    const request: CreatePoolRequest = req.body;
    
    // Validate year
    if (request.year === undefined || request.year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: request.year,
        type: typeof request.year,
        example: { year: 2024, memberShipIds: ['SHIP001'] }
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
    
    // Validate memberShipIds
    if (!request.memberShipIds) {
      return res.status(400).json({ 
        error: 'memberShipIds is required and must be an array',
        received: request.memberShipIds,
        type: typeof request.memberShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    if (!Array.isArray(request.memberShipIds)) {
      return res.status(400).json({ 
        error: 'memberShipIds must be an array of strings',
        received: request.memberShipIds,
        type: typeof request.memberShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    if (request.memberShipIds.length === 0) {
      return res.status(400).json({ 
        error: 'memberShipIds must contain at least one ship ID',
        received: request.memberShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    // Validate each ship ID is a string
    const invalidShipIds = request.memberShipIds.filter(id => typeof id !== 'string' || id.trim() === '');
    if (invalidShipIds.length > 0) {
      return res.status(400).json({ 
        error: 'All memberShipIds must be non-empty strings',
        invalidShipIds: invalidShipIds,
        example: { year: 2024, memberShipIds: ['SHIP001', 'SHIP002'] }
      });
    }
    
    // Create validated request
    const validatedRequest: CreatePoolRequest = {
      name: request.name || undefined,
      year: yearNum,
      memberShipIds: request.memberShipIds.map(id => id.trim()),
    };
    
    const pool = await poolUseCase.createPool(validatedRequest);
    res.json(pool);
  } catch (error: any) {
    console.error('Error creating pool:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create pool',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/pools
 * 
 * Retrieves all compliance pools from the database, including their
 * member ships and before/after compliance balance information.
 * 
 * @route GET /api/pools
 * @returns {Promise<Pool[]>} Array of all pools with member data
 * @throws {500} Internal server error or database schema issues
 * 
 * @example
 * // Request
 * GET /api/pools
 * 
 * // Response 200
 * [
 *   {
 *     "poolId": "pool-1234567890",
 *     "name": "Strategic Pool 2024",
 *     "year": 2024,
 *     "members": [ ... ],
 *     "poolSum": 0,
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get('/pools', async (req: Request, res: Response) => {
  try {
    const pools = await poolUseCase.getAllPools();
    res.json(pools);
  } catch (error: any) {
    console.error('Error fetching pools:', error);
    
    // Provide helpful error message if table/column doesn't exist
    if (error.code === '42703' || error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Database schema issue detected. Please run the schema: npm run schema',
        details: error.message,
        hint: 'The pools table may not exist or may be missing columns. Run: npm run schema'
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to fetch pools',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Export the router instance for use in the main server configuration
 * @exports router
 */
export default router;

