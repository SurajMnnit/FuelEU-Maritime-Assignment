/**
 * Banking Routes Module
 * 
 * This module defines all HTTP endpoints related to banking operations,
 * including banking surplus compliance balance and applying banked amounts
 * to cover deficits. Banking allows ships to save surplus compliance for
 * future use or apply it to offset current deficits.
 * 
 * @module routes/bankingRoutes
 * @requires express
 * @requires BankingUseCase
 * @requires PostgresBankingRepository
 */

import { Router, Request, Response } from 'express';
import { BankingUseCase } from '../../../../core/application/BankingUseCase';
import { PostgresBankingRepository } from '../../../outbound/postgres/PostgresBankingRepository';
import { BankOperation, ApplyOperation } from '../../../../core/domain/Banking';

const router = Router();

// Initialize repository and use case instances
// Using PostgreSQL repository for persistent data storage
const bankingRepository = new PostgresBankingRepository();
const bankingUseCase = new BankingUseCase(bankingRepository);

/**
 * POST /api/banking/bank
 * 
 * Banks (saves) surplus compliance balance for a specific ship and year.
 * This operation allows ships with positive compliance balance to save
 * their surplus for future use or to apply to deficits in other years.
 * 
 * The banked amount is stored per-ship and per-year, allowing granular
 * tracking of banked compliance credits.
 * 
 * @route POST /api/banking/bank
 * @param {Object} body - Banking operation request
 * @param {string} body.shipId - The unique identifier of the ship
 * @param {number} body.year - The year for which to bank the surplus
 * @param {number} body.amount - The amount of compliance balance to bank (in gCO₂e)
 * @returns {Promise<Object>} Success response with banked amount details
 * @throws {400} Invalid or missing request parameters
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * POST /api/banking/bank
 * Content-Type: application/json
 * {
 *   "shipId": "R001",
 *   "year": 2024,
 *   "amount": 10000
 * }
 * 
 * // Response 200
 * {
 *   "success": true,
 *   "shipId": "R001",
 *   "year": 2024,
 *   "bankedAmount": 10000,
 *   "message": "Successfully banked 10000 gCO₂e for ship R001"
 * }
 */
router.post('/banking/bank', async (req: Request, res: Response) => {
  try {
    // Log request for debugging
    console.log('Bank request body:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          shipId: 'R001',
          year: 2024,
          amount: 10000
        }
      });
    }
    
    const { shipId, year, amount } = req.body;
    
    // Validate shipId
    if (!shipId || typeof shipId !== 'string' || shipId.trim() === '') {
      return res.status(400).json({ 
        error: 'shipId is required and must be a non-empty string',
        received: shipId,
        type: typeof shipId,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate year
    if (year === undefined || year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: year,
        type: typeof year,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json({ 
        error: 'year must be a valid positive number',
        received: year,
        parsed: yearNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({ 
        error: 'amount is required',
        received: amount,
        type: typeof amount,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        error: 'amount must be a valid positive number',
        received: amount,
        parsed: amountNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    await bankingRepository.bankSurplusForShip(shipId.trim(), yearNum, amountNum);
    const bankedAmount = await bankingRepository.getBankedAmountForShip(shipId.trim(), yearNum);
    
    res.json({
      success: true,
      shipId: shipId.trim(),
      year: yearNum,
      bankedAmount,
      message: `Successfully banked ${amountNum} gCO₂e for ship ${shipId.trim()}`,
    });
  } catch (error: any) {
    console.error('Error banking surplus:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to bank surplus',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/banking/apply
 * 
 * Applies (uses) previously banked surplus compliance balance to a ship's
 * current compliance balance. This operation reduces the banked amount and
 * increases the ship's adjusted compliance balance, effectively using saved
 * credits to offset current deficits.
 * 
 * The applied amount must not exceed the available banked amount for the
 * specified ship and year.
 * 
 * @route POST /api/banking/apply
 * @param {Object} body - Apply operation request
 * @param {string} body.shipId - The unique identifier of the ship
 * @param {number} body.year - The year for which to apply the banked surplus
 * @param {number} body.amount - The amount of banked surplus to apply (in gCO₂e)
 * @returns {Promise<Object>} Success response with applied amount details
 * @throws {400} Invalid or missing request parameters
 * @throws {500} Internal server error or insufficient banked amount
 * 
 * @example
 * // Request
 * POST /api/banking/apply
 * Content-Type: application/json
 * {
 *   "shipId": "R001",
 *   "year": 2024,
 *   "amount": 5000
 * }
 * 
 * // Response 200
 * {
 *   "success": true,
 *   "shipId": "R001",
 *   "year": 2024,
 *   "appliedAmount": 5000,
 *   "message": "Successfully applied 5000 gCO₂e from banked surplus to ship R001"
 * }
 */
router.post('/banking/apply', async (req: Request, res: Response) => {
  try {
    // Log request for debugging
    console.log('Apply request body:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Request body is required and cannot be empty',
        hint: 'Make sure to send a JSON body with Content-Type: application/json',
        example: {
          shipId: 'R001',
          year: 2024,
          amount: 10000
        }
      });
    }
    
    const { shipId, year, amount } = req.body;
    
    // Validate shipId
    if (!shipId || typeof shipId !== 'string' || shipId.trim() === '') {
      return res.status(400).json({ 
        error: 'shipId is required and must be a non-empty string',
        received: shipId,
        type: typeof shipId,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate year
    if (year === undefined || year === null) {
      return res.status(400).json({ 
        error: 'year is required',
        received: year,
        type: typeof year,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json({ 
        error: 'year must be a valid positive number',
        received: year,
        parsed: yearNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    // Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({ 
        error: 'amount is required',
        received: amount,
        type: typeof amount,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        error: 'amount must be a valid positive number',
        received: amount,
        parsed: amountNum,
        example: { shipId: 'R001', year: 2024, amount: 10000 }
      });
    }
    
    await bankingRepository.applyBankedSurplusToShip(shipId.trim(), yearNum, amountNum);
    
    res.json({
      success: true,
      shipId: shipId.trim(),
      year: yearNum,
      appliedAmount: amountNum,
      message: `Successfully applied ${amountNum} gCO₂e from banked surplus to ship ${shipId.trim()}`,
    });
  } catch (error: any) {
    console.error('Error applying banked surplus:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to apply banked surplus',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/banking/banked/:shipId/:year
 * 
 * Retrieves the total banked amount for a specific ship and year.
 * This endpoint returns the cumulative amount of compliance balance
 * that has been banked (saved) for the specified ship and year,
 * minus any amounts that have been applied.
 * 
 * @route GET /api/banking/banked/:shipId/:year
 * @param {string} shipId - The unique identifier of the ship
 * @param {string} year - The year for which to retrieve banked amount
 * @returns {Promise<Object>} Banked amount information
 * @throws {400} Invalid year parameter
 * @throws {500} Internal server error
 * 
 * @example
 * // Request
 * GET /api/banking/banked/R001/2024
 * 
 * // Response 200
 * {
 *   "shipId": "R001",
 *   "year": 2024,
 *   "bankedAmount": 5000
 * }
 */
router.get('/banking/banked/:shipId/:year', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.params;
    const bankedAmount = await bankingRepository.getBankedAmountForShip(shipId, parseInt(year));
    res.json({ shipId, year: parseInt(year), bankedAmount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get banked amount' });
  }
});

/**
 * Export the router instance for use in the main server configuration
 * @exports router
 */
export default router;

