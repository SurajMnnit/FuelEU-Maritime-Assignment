export interface BankOperation {
  year: number;
  amount: number; // Positive CB to bank (gCO₂e)
}

export interface ApplyOperation {
  year: number;
  amount: number; // Amount to apply from banked surplus (gCO₂e)
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
  success: boolean;
  message?: string;
}

