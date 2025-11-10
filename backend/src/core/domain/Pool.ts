export interface PoolMember {
  shipId: string;
  adjustedCB: number;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  poolId: string;
  name?: string;
  year: number;
  members: PoolMember[];
  poolSum: number; // Sum of adjusted CBs
  createdAt: Date;
}

export interface CreatePoolRequest {
  name?: string;
  year: number;
  memberShipIds: string[];
}

