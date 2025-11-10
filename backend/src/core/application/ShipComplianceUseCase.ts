import { ShipCompliance, ComputeCBRequest } from '../domain/ShipCompliance';
import { ShipComplianceRepository } from '../ports/ShipComplianceRepository';

export class ShipComplianceUseCase {
  constructor(private shipComplianceRepository: ShipComplianceRepository) {}

  /**
   * Get compliance balance for a specific ship and year
   */
  async getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | null> {
    return this.shipComplianceRepository.findByShipAndYear(shipId, year);
  }

  /**
   * Get all ship compliance balances for a given year
   */
  async getAllShipCompliance(year: number): Promise<ShipCompliance[]> {
    return this.shipComplianceRepository.findByYear(year);
  }

  /**
   * Compute and save compliance balance for a ship based on route data
   */
  async computeComplianceBalance(request: ComputeCBRequest): Promise<ShipCompliance> {
    return this.shipComplianceRepository.computeAndSave(
      request.shipId,
      request.year,
      request.routeId
    );
  }

  /**
   * Update compliance balance for a ship
   */
  async updateComplianceBalance(shipCompliance: ShipCompliance): Promise<ShipCompliance> {
    return this.shipComplianceRepository.save(shipCompliance);
  }
}

