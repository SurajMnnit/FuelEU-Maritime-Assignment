import { IShipComplianceRepository } from '../../ports/repositories/IShipComplianceRepository';
import { ShipCompliance, ComputeCBRequest } from '../../domain/models/ShipCompliance';

export class ShipComplianceUseCases {
  constructor(private repository: IShipComplianceRepository) {}

  /**
   * Get compliance balance for a specific ship and year
   */
  async getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | null> {
    return this.repository.getShipCompliance(shipId, year);
  }

  /**
   * Get all ship compliance balances for a given year
   */
  async getAllShipCompliance(year: number): Promise<ShipCompliance[]> {
    return this.repository.getAllShipCompliance(year);
  }

  /**
   * Compute and save compliance balance for a ship based on route data
   */
  async computeComplianceBalance(request: ComputeCBRequest): Promise<ShipCompliance> {
    return this.repository.computeComplianceBalance(request);
  }
}

