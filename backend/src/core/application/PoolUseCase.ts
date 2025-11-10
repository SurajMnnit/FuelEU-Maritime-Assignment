/**
 * Pool Use Case
 * 
 * This class contains the business logic for compliance pool operations,
 * including pool creation with Article 21 validation rules. It implements
 * the application layer of the hexagonal architecture.
 * 
 * Article 21 Pooling Rules:
 * 1. Sum of adjusted CBs must be >= 0 (pool must be collectively compliant)
 * 2. Deficit ships cannot exit worse than they entered (cbAfter >= cbBefore)
 * 3. Surplus ships cannot exit negative (cbAfter >= 0)
 * 
 * @class PoolUseCase
 * @module application/PoolUseCase
 */

import { Pool, CreatePoolRequest, PoolMember } from '../domain/Pool';
import { PoolRepository } from '../ports/PoolRepository';
import { ShipComplianceRepository } from '../ports/ShipComplianceRepository';

/**
 * Pool Use Case Class
 * 
 * Handles all business logic related to compliance pool operations, including:
 * - Pool creation with member ships
 * - Article 21 rule validation
 * - Pool retrieval and management
 */
export class PoolUseCase {
  /**
   * Creates an instance of PoolUseCase
   * 
   * @param {PoolRepository} poolRepository - Repository for pool data access
   * @param {ShipComplianceRepository} shipComplianceRepository - Repository for ship compliance data access
   */
  constructor(
    private poolRepository: PoolRepository,
    private shipComplianceRepository: ShipComplianceRepository
  ) {}

  /**
   * Creates a new compliance pool with the specified member ships
   * 
   * This method:
   * 1. Retrieves adjusted compliance balances for all member ships
   * 2. Validates that the pool sum is non-negative
   * 3. Calculates equal distribution of pool sum among members
   * 4. Validates Article 21 rules (deficit/surplus ship protections)
   * 5. Saves the pool with before/after CB values
   * 
   * @param {CreatePoolRequest} request - Pool creation request with year, member ship IDs, and optional name
   * @returns {Promise<Pool>} The created pool with all member data
   * @throws {Error} If compliance balance not found for any ship
   * @throws {Error} If pool sum is negative
   * @throws {Error} If Article 21 validation rules are violated
   */
  async createPool(request: CreatePoolRequest): Promise<Pool> {
    // Step 1: Retrieve adjusted compliance balances for all member ships
    // Adjusted CB is the compliance balance after banking operations
    const members: PoolMember[] = [];
    
    for (const shipId of request.memberShipIds) {
      // Get the ship's adjusted compliance balance for the specified year
      const shipCompliance = await this.shipComplianceRepository.findByShipAndYear(shipId, request.year);
      if (!shipCompliance) {
        throw new Error(`Compliance balance not found for ship ${shipId} in year ${request.year}`);
      }
      
      // Initialize member with before-pool CB (same as adjusted CB)
      // cbAfter will be calculated after pooling validation
      members.push({
        shipId,
        adjustedCB: shipCompliance.cbGco2eq,
        cbBefore: shipCompliance.cbGco2eq,
        cbAfter: 0, // Will be calculated after pooling
      });
    }

    // Step 2: Calculate pool sum (sum of all members' adjusted CBs)
    // Pool sum must be >= 0 for the pool to be valid
    const poolSum = members.reduce((sum, member) => sum + member.adjustedCB, 0);

    if (poolSum < 0) {
      throw new Error('Cannot create pool: Sum of compliance balances is negative');
    }

    // Step 3: Calculate CB after pooling (equal distribution)
    // The pool sum is distributed equally among all members
    const cbAfter = poolSum / members.length;
    
    // Step 4: Validate Article 21 pooling rules
    // These rules protect ships from exiting pools in worse positions:
    // 
    // Rule 1: Deficit ships (cbBefore < 0) cannot exit worse
    //         They must have cbAfter >= cbBefore
    // 
    // Rule 2: Surplus ships (cbBefore > 0) cannot exit negative
    //         They must have cbAfter >= 0
    const validationErrors: string[] = [];
    
    for (const member of members) {
      const isDeficit = member.cbBefore < 0;
      const isSurplus = member.cbBefore > 0;
      
      // Check Rule 1: Deficit ship protection
      if (isDeficit && cbAfter < member.cbBefore) {
        validationErrors.push(
          `Deficit ship ${member.shipId} cannot exit worse: ` +
          `CB before: ${member.cbBefore}, CB after: ${cbAfter}`
        );
      }
      
      // Check Rule 2: Surplus ship protection
      if (isSurplus && cbAfter < 0) {
        validationErrors.push(
          `Surplus ship ${member.shipId} cannot exit negative: ` +
          `CB before: ${member.cbBefore}, CB after: ${cbAfter}`
        );
      }
    }
    
    // If any validation errors, throw with detailed message
    if (validationErrors.length > 0) {
      throw new Error(
        'Cannot create pool: Violates Article 21 pooling rules:\n' +
        validationErrors.join('\n')
      );
    }
    
    // Step 5: All validations passed, assign calculated cbAfter to all members
    members.forEach(member => {
      member.cbAfter = cbAfter;
    });

    const pool: Pool = {
      poolId: `pool-${Date.now()}`,
      name: request.name,
      year: request.year,
      members,
      poolSum,
      createdAt: new Date(),
    };

    return this.poolRepository.save(pool);
  }

  /**
   * Retrieves all pools from the repository
   * 
   * @returns {Promise<Pool[]>} Array of all pools with their member data
   * @throws {Error} If pool retrieval fails
   */
  async getAllPools(): Promise<Pool[]> {
    return this.poolRepository.findAll();
  }
}

