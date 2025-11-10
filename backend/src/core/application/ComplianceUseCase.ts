import { ComplianceBalance, AdjustedComplianceBalance } from '../domain/Compliance';
import { ComplianceRepository } from '../ports/ComplianceRepository';

export class ComplianceUseCase {
  constructor(private complianceRepository: ComplianceRepository) {}

  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    return this.complianceRepository.findComplianceBalance(year);
  }

  async getAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]> {
    return this.complianceRepository.findAdjustedComplianceBalance(year);
  }
}

