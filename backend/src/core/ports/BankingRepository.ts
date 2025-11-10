import { ComplianceBalance } from '../domain/Compliance';

export interface BankingRepository {
  getComplianceBalance(year: number): Promise<ComplianceBalance>;
  // Per-ship banking methods
  bankSurplusForShip(shipId: string, year: number, amount: number): Promise<void>;
  getBankedAmountForShip(shipId: string, year: number): Promise<number>;
  applyBankedSurplusToShip(shipId: string, year: number, amount: number): Promise<void>;
  // Legacy methods (deprecated)
  bankSurplus(year: number, amount: number): Promise<void>;
  getBankedAmount(year: number): Promise<number>;
  applyBankedSurplus(year: number, amount: number): Promise<void>;
}

