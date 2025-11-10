import { ComplianceBalance, AdjustedComplianceBalance, BankingOperation } from '../../domain/models/Compliance';

export interface IComplianceRepository {
  getComplianceBalance(year: number): Promise<ComplianceBalance>;
  getAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]>;
  bankSurplus(amount: number, year: number): Promise<BankingOperation>;
  applyBanked(amount: number, year: number): Promise<BankingOperation>;
}
