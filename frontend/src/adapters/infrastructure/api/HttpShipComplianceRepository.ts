import { IShipComplianceRepository } from '../../../core/ports/repositories/IShipComplianceRepository';
import { ShipCompliance, ComputeCBRequest } from '../../../core/domain/models/ShipCompliance';

const API_BASE_URL = '/api';

export class HttpShipComplianceRepository implements IShipComplianceRepository {
  /**
   * Get compliance balance for a specific ship and year
   * GET /api/ship-compliance/:shipId/:year
   */
  async getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | null> {
    const response = await fetch(`${API_BASE_URL}/ship-compliance/${encodeURIComponent(shipId)}/${year}`);
    
    if (response.status === 404) {
      return null; // Ship compliance not found
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch ship compliance' }));
      throw new Error(error.error || 'Failed to fetch ship compliance');
    }
    
    const data = await response.json();
    return {
      id: data.id,
      shipId: data.shipId,
      year: data.year,
      cbGco2eq: data.cbGco2eq,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }

  /**
   * Get all ship compliance balances for a given year
   * GET /api/ship-compliance/year/:year
   */
  async getAllShipCompliance(year: number): Promise<ShipCompliance[]> {
    const url = `${API_BASE_URL}/ship-compliance/year/${year}`;
    console.log('Fetching from URL:', url);
    
    try {
      const response = await fetch(url);
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 404) {
        // 404 means no data found, return empty array
        console.log('404 response - no data found');
        return [];
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Failed to fetch ship compliance list' };
        }
        throw new Error(error.error || 'Failed to fetch ship compliance list');
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
      
      // Handle both array and non-array responses
      if (!Array.isArray(data)) {
        console.warn('Response is not an array:', data);
        return [];
      }
      
      const mapped = data.map((item: any) => ({
        id: item.id,
        shipId: item.shipId,
        year: item.year,
        cbGco2eq: item.cbGco2eq,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      }));
      
      console.log('Mapped data:', mapped);
      return mapped;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  /**
   * Compute and save compliance balance for a ship based on route data
   * POST /api/ship-compliance/compute
   */
  async computeComplianceBalance(request: ComputeCBRequest): Promise<ShipCompliance> {
    const response = await fetch(`${API_BASE_URL}/ship-compliance/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipId: request.shipId,
        year: request.year,
        routeId: request.routeId || request.shipId, // Use shipId as routeId if not provided
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to compute ship compliance' }));
      throw new Error(error.error || 'Failed to compute ship compliance');
    }

    const data = await response.json();
    return {
      id: data.id,
      shipId: data.shipId,
      year: data.year,
      cbGco2eq: data.cbGco2eq,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }
}

