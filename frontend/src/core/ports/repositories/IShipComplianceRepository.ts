import { ShipCompliance, ComputeCBRequest } from '../../domain/models/ShipCompliance';

export interface IShipComplianceRepository {
  /**
   * Get compliance balance for a specific ship and year
   */
  getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | null>;

  /**
   * Get all ship compliance balances for a given year
   */
  getAllShipCompliance(year: number): Promise<ShipCompliance[]>;

  /**
   * Compute and save compliance balance for a ship based on route data
   */
  computeComplianceBalance(request: ComputeCBRequest): Promise<ShipCompliance>;
}

