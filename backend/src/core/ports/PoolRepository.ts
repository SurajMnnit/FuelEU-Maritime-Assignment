import { Pool } from '../domain/Pool';

export interface PoolRepository {
  save(pool: Pool): Promise<Pool>;
  findAll(): Promise<Pool[]>;
  findById(poolId: string): Promise<Pool | null>;
}

