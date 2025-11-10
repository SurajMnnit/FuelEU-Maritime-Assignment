import { IPoolRepository } from '../../../core/ports/repositories/IPoolRepository';
import { Pool, PoolCreationRequest, PoolMember } from '../../../core/domain/models/Pool';

const API_BASE_URL = '/api';

export class HttpPoolRepository implements IPoolRepository {
  async getAllPools(): Promise<Pool[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/pools`);
      
      if (response.status === 404) {
        return [];
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch pools' }));
        throw new Error(error.error || 'Failed to fetch pools');
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        return [];
      }
      
      // Map backend response to frontend format
      return data.map((pool: any) => ({
        poolId: pool.poolId,
        name: pool.name || undefined,
        year: pool.year,
        members: pool.members.map((member: any) => ({
          shipId: member.shipId,
          shipName: `Ship ${member.shipId}`,
          adjustedCB: member.adjustedCB || member.cbBefore || 0,
          cbBeforePool: member.cbBefore || member.cbBeforePool || 0,
          cbAfterPool: member.cbAfter || member.cbAfterPool || 0,
        })),
        totalCB: pool.poolSum || 0,
        isValid: (pool.poolSum || 0) >= 0,
        createdAt: new Date(pool.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching pools:', error);
      return [];
    }
  }

  async getPoolById(poolId: string): Promise<Pool | null> {
    // Backend doesn't have a GET pool by ID endpoint yet
    // TODO: Add GET /api/pools/:poolId endpoint to backend
    return null;
  }

  async createPool(request: PoolCreationRequest): Promise<Pool> {
    // First, get adjusted CBs for validation
    const adjustedCBsResponse = await fetch(`${API_BASE_URL}/compliance/adjusted-cb?year=${request.year}`);
    if (!adjustedCBsResponse.ok) {
      throw new Error('Failed to fetch adjusted compliance balances');
    }
    const adjustedCBs = await adjustedCBsResponse.json();

    // Create pool members from ship IDs
    const members: PoolMember[] = request.shipIds.map(shipId => {
      const ship = adjustedCBs.find((cb: any) => cb.shipId === shipId);
      if (!ship) {
        throw new Error(`Ship ${shipId} not found or has no adjusted CB for year ${request.year}`);
      }

      return {
        shipId,
        shipName: `Ship ${shipId}`, // Backend doesn't provide ship names
        adjustedCB: ship.adjustedCB,
        cbBeforePool: ship.adjustedCB,
        cbAfterPool: 0, // Will be calculated after pool creation
      };
    });

    const totalCB = members.reduce((sum, m) => sum + m.adjustedCB, 0);

    // Call backend to create pool
    const response = await fetch(`${API_BASE_URL}/pools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: request.name,
        year: request.year,
        memberShipIds: request.shipIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create pool');
    }

    const backendPool = await response.json();

    // Calculate average CB for distribution
    const avgCB = totalCB / members.length;
    members.forEach(m => {
      m.cbAfterPool = avgCB;
    });

    // Map backend response to frontend format
    const pool: Pool = {
      poolId: backendPool.poolId,
      name: backendPool.name || request.name,
      year: backendPool.year,
      members,
      totalCB: backendPool.poolSum,
      isValid: backendPool.poolSum >= 0,
      createdAt: new Date(backendPool.createdAt),
    };

    return pool;
  }

  async validatePool(shipIds: string[], year: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/adjusted-cb?year=${year}`);
      if (!response.ok) {
        return false;
      }
      const adjustedCBs = await response.json();

      const totalCB = shipIds.reduce((sum, shipId) => {
        const ship = adjustedCBs.find((cb: any) => cb.shipId === shipId);
        return sum + (ship?.adjustedCB || 0);
      }, 0);

      return totalCB >= 0;
    } catch {
      return false;
    }
  }
}

