import { ComplianceBalance, AdjustedComplianceBalance } from '../domain/Compliance';

export interface ComplianceRepository {
  findComplianceBalance(year: number): Promise<ComplianceBalance>;
  findAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]>;
}

