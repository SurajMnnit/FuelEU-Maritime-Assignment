import { IPoolRepository } from '../../ports/repositories/IPoolRepository';
import { Pool, PoolCreationRequest } from '../../domain/models/Pool';
import { AdjustedComplianceBalance } from '../../domain/models/Compliance';

export class PoolUseCases {
  constructor(private poolRepository: IPoolRepository) {}

  async getAllPools(): Promise<Pool[]> {
    return await this.poolRepository.getAllPools();
  }

  async createPool(request: PoolCreationRequest): Promise<Pool> {
    const isValid = await this.poolRepository.validatePool(request.shipIds, request.year);
    if (!isValid) {
      throw new Error('Pool cannot be created: total adjusted CB must be non-negative');
    }
    return await this.poolRepository.createPool(request);
  }

  canCreatePool(members: AdjustedComplianceBalance[]): boolean {
    const totalCB = members.reduce((sum, member) => sum + member.adjustedCB, 0);
    return totalCB >= 0;
  }

  calculatePoolTotal(members: AdjustedComplianceBalance[]): number {
    return members.reduce((sum, member) => sum + member.adjustedCB, 0);
  }
}
