import { IComplianceRepository } from '../../ports/repositories/IComplianceRepository';
import { ComplianceBalance, AdjustedComplianceBalance, BankingOperation } from '../../domain/models/Compliance';

export class ComplianceUseCases {
  constructor(private complianceRepository: IComplianceRepository) {}

  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    return await this.complianceRepository.getComplianceBalance(year);
  }

  async getAdjustedComplianceBalances(year: number): Promise<AdjustedComplianceBalance[]> {
    return await this.complianceRepository.getAdjustedComplianceBalance(year);
  }

  async bankSurplus(amount: number, year: number): Promise<BankingOperation> {
    if (amount <= 0) {
      throw new Error('Cannot bank non-positive amount');
    }
    return await this.complianceRepository.bankSurplus(amount, year);
  }

  async applyBankedSurplus(amount: number, year: number): Promise<BankingOperation> {
    if (amount <= 0) {
      throw new Error('Cannot apply non-positive amount');
    }
    return await this.complianceRepository.applyBanked(amount, year);
  }

  canBankSurplus(cb: number): boolean {
    return cb > 0;
  }

  canApplyBanked(cb: number, bankedAmount: number): boolean {
    return cb < 0 && bankedAmount > 0;
  }
}
