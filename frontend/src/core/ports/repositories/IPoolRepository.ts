import { Pool, PoolCreationRequest } from '../../domain/models/Pool';

export interface IPoolRepository {
  getAllPools(): Promise<Pool[]>;
  getPoolById(poolId: string): Promise<Pool | null>;
  createPool(request: PoolCreationRequest): Promise<Pool>;
  validatePool(shipIds: string[], year: number): Promise<boolean>;
}
