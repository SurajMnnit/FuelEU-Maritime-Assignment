import { ShipCompliance } from '../domain/ShipCompliance';

export interface ShipComplianceRepository {
  /**
   * Find compliance balance for a specific ship and year
   */
  findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;

  /**
   * Find all compliance balances for a given year
   */
  findByYear(year: number): Promise<ShipCompliance[]>;

  /**
   * Save or update ship compliance balance
   */
  save(shipCompliance: ShipCompliance): Promise<ShipCompliance>;

  /**
   * Compute and save CB for a ship based on route data
   */
  computeAndSave(shipId: string, year: number, routeId: string): Promise<ShipCompliance>;
}

