import { BankOperation, ApplyOperation, BankingResult } from '../domain/Banking';
import { BankingRepository } from '../ports/BankingRepository';

export class BankingUseCase {
  constructor(private bankingRepository: BankingRepository) {}

  async bankSurplus(operation: BankOperation): Promise<BankingResult> {
    const currentCB = await this.bankingRepository.getComplianceBalance(operation.year);
    
    if (currentCB.cb <= 0) {
      return {
        cbBefore: currentCB.cb,
        applied: 0,
        cbAfter: currentCB.cb,
        success: false,
        message: 'Cannot bank: Compliance Balance is not positive',
      };
    }

    const bankedAmount = Math.min(operation.amount, currentCB.cb);
    await this.bankingRepository.bankSurplus(operation.year, bankedAmount);

    return {
      cbBefore: currentCB.cb,
      applied: bankedAmount,
      cbAfter: currentCB.cb - bankedAmount,
      success: true,
    };
  }

  async applyBankedSurplus(operation: ApplyOperation): Promise<BankingResult> {
    const currentCB = await this.bankingRepository.getComplianceBalance(operation.year);
    const bankedAmount = await this.bankingRepository.getBankedAmount(operation.year);

    if (bankedAmount <= 0) {
      return {
        cbBefore: currentCB.cb,
        applied: 0,
        cbAfter: currentCB.cb,
        success: false,
        message: 'No banked surplus available',
      };
    }

    const appliedAmount = Math.min(operation.amount, bankedAmount);
    await this.bankingRepository.applyBankedSurplus(operation.year, appliedAmount);

    const updatedCB = await this.bankingRepository.getComplianceBalance(operation.year);

    return {
      cbBefore: currentCB.cb,
      applied: appliedAmount,
      cbAfter: updatedCB.cb,
      success: true,
    };
  }
}

