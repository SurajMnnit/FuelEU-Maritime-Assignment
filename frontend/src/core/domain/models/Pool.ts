export interface PoolMember {
  shipId: string;
  shipName: string;
  adjustedCB: number;
  cbBeforePool: number;
  cbAfterPool: number;
}

export interface Pool {
  poolId: string;
  name: string;
  year: number;
  members: PoolMember[];
  totalCB: number;
  isValid: boolean;
  createdAt: Date;
}

export interface PoolCreationRequest {
  name: string;
  year: number;
  shipIds: string[];
}
