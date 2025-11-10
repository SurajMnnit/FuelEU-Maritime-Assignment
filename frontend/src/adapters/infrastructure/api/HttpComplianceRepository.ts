import { IComplianceRepository } from '../../../core/ports/repositories/IComplianceRepository';
import { ComplianceBalance, AdjustedComplianceBalance, BankingOperation } from '../../../core/domain/models/Compliance';

const API_BASE_URL = '/api';

export class HttpComplianceRepository implements IComplianceRepository {
  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    const response = await fetch(`${API_BASE_URL}/compliance/cb?year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch compliance balance');
    }
    const data = await response.json();
    
    // Map backend format to frontend format
    return {
      year: data.year,
      complianceBalance: data.cb, // Backend uses 'cb', frontend uses 'complianceBalance'
      status: data.cb > 0 ? 'surplus' : data.cb < 0 ? 'deficit' : 'neutral',
    };
  }

  async getAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]> {
    const response = await fetch(`${API_BASE_URL}/compliance/adjusted-cb?year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch adjusted compliance balance');
    }
    const data = await response.json();
    
    // Map backend format to frontend format
    // Backend doesn't have shipName, so we'll generate one
    return data.map((item: any, index: number) => ({
      shipId: item.shipId,
      shipName: `Ship ${item.shipId}`, // Generate a name if not provided
      adjustedCB: item.adjustedCB,
      year: item.year,
    }));
  }

  async bankSurplus(amount: number, year: number): Promise<BankingOperation> {
    const response = await fetch(`${API_BASE_URL}/banking/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to bank surplus');
    }

    const data = await response.json();
    
    // Map backend response to frontend format
    return {
      operationType: 'bank',
      amount: data.applied || amount,
      year,
      cb_before: data.cbBefore || 0,
      cb_after: data.cbAfter || 0,
    };
  }

  async applyBanked(amount: number, year: number): Promise<BankingOperation> {
    const response = await fetch(`${API_BASE_URL}/banking/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to apply banked surplus');
    }

    const data = await response.json();
    
    // Map backend response to frontend format
    return {
      operationType: 'apply',
      amount: data.applied || amount,
      year,
      cb_before: data.cbBefore || 0,
      cb_after: data.cbAfter || 0,
    };
  }
}

