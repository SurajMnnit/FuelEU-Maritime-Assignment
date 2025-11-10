/**
 * Compliance Routes Module
 * 
 * This module defines all HTTP endpoints related to compliance balance operations,
 * including overall compliance balance retrieval and adjusted compliance balance
 * per ship (used for pooling operations).
 * 
 * @module routes/complianceRoutes
 * @requires express
 * @requires ComplianceUseCase
 * @requires PostgresComplianceRepository
 */

import { Router, Request, Response } from 'express';
import { ComplianceUseCase } from '../../../../core/application/ComplianceUseCase';
import { PostgresComplianceRepository } from '../../../outbound/postgres/PostgresComplianceRepository';

const router = Router();

// Initialize repository and use case instances
// Using PostgreSQL repository for persistent data storage
const complianceRepository = new PostgresComplianceRepository();
const complianceUseCase = new ComplianceUseCase(complianceRepository);

/**
 * GET /api/compliance/cb
 * 
 * Retrieves the overall compliance balance for a given year.
 * This represents the sum of all ships' compliance balances for the specified year.
 * 
 * @route GET /api/compliance/cb
 * @param {string} query.year - The year for which to retrieve compliance balance
 * @returns {Promise<Object>} Overall compliance balance information
 * @throws {400} Missing or invalid year parameter
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * GET /api/compliance/cb?year=2024
 * 
 * // Response 200
 * {
 *   "year": 2024,
 *   "totalCB": 1500000,
 *   "isCompliant": true
 * }
 */
router.get('/compliance/cb', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    if (!year) {
      return res.status(400).json({ error: 'year query parameter is required' });
    }
    const cb = await complianceUseCase.getComplianceBalance(year);
    res.json(cb);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance balance' });
  }
});

/**
 * GET /api/compliance/adjusted-cb
 * 
 * Retrieves the adjusted compliance balance per ship for a given year.
 * Adjusted CB is the compliance balance after banking operations have been applied.
 * This data is used for pooling operations, as pools operate on adjusted CB values.
 * 
 * @route GET /api/compliance/adjusted-cb
 * @param {string} query.year - The year for which to retrieve adjusted compliance balances
 * @returns {Promise<Array>} Array of adjusted compliance balances per ship
 * @throws {400} Missing or invalid year parameter
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * GET /api/compliance/adjusted-cb?year=2024
 * 
 * // Response 200
 * [
 *   {
 *     "shipId": "R001",
 *     "year": 2024,
 *     "adjustedCB": 50000
 *   },
 *   {
 *     "shipId": "R002",
 *     "year": 2024,
 *     "adjustedCB": -30000
 *   }
 * ]
 */
router.get('/compliance/adjusted-cb', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    if (!year) {
      return res.status(400).json({ error: 'year query parameter is required' });
    }
    const adjustedCBs = await complianceUseCase.getAdjustedComplianceBalance(year);
    res.json(adjustedCBs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch adjusted compliance balance' });
  }
});

/**
 * Export the router instance for use in the main server configuration
 * @exports router
 */
export default router;