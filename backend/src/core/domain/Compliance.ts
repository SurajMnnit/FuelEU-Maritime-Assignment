export interface ComplianceBalance {
  year: number;
  cb: number; // Compliance Balance (gCO₂e)
  cbBefore?: number;
  applied?: number;
  cbAfter?: number;
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  adjustedCB: number; // Adjusted Compliance Balance (gCO₂e)
}

