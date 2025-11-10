export interface ComplianceBalance {
  year: number;
  complianceBalance: number;
  status: 'surplus' | 'deficit' | 'neutral';
}

export interface AdjustedComplianceBalance {
  shipId: string;
  shipName: string;
  adjustedCB: number;
  year: number;
}

export interface BankingOperation {
  operationType: 'bank' | 'apply';
  amount: number;
  year: number;
  cb_before: number;
  cb_after: number;
}
