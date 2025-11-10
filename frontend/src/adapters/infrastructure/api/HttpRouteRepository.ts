import { IRouteRepository } from '../../../core/ports/repositories/IRouteRepository';
import { Route, RouteComparison } from '../../../core/domain/models/Route';

const API_BASE_URL = '/api';
const TARGET_INTENSITY = 89.3368; // gCO₂e/MJ

export class HttpRouteRepository implements IRouteRepository {
  async getAllRoutes(): Promise<Route[]> {
    const response = await fetch(`${API_BASE_URL}/routes`);
    if (!response.ok) {
      throw new Error('Failed to fetch routes');
    }
    const data = await response.json();
    // Map backend Route to frontend Route format
    return data.map((route: any) => ({
      routeId: route.routeId,
      vesselType: route.vesselType,
      fuelType: route.fuelType,
      year: route.year,
      ghgIntensity: route.ghgIntensity,
      fuelConsumption: route.fuelConsumption,
      distance: route.distance,
      totalEmissions: route.totalEmissions,
      isBaseline: route.isBaseline || false,
    }));
  }

  async getRouteById(routeId: string): Promise<Route | null> {
    const routes = await this.getAllRoutes();
    return routes.find(r => r.routeId === routeId) || null;
  }

  async setBaseline(routeId: string): Promise<void> {
    const route = await this.getRouteById(routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    const response = await fetch(`${API_BASE_URL}/routes/${routeId}/baseline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routeId: route.routeId,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to set baseline');
    }
  }

  async getComparison(baselineYear: number, comparisonYear: number): Promise<RouteComparison[]> {
    // Get all routes first to get vesselType and fuelType for baseline
    const allRoutes = await this.getAllRoutes();
    
    // Find the baseline route (only one can be baseline)
    const baselineRoute = allRoutes.find(r => r.isBaseline);
    
    if (!baselineRoute) {
      console.warn('No baseline route found');
      return [];
    }

    // Call the backend comparison API to get all comparisons
    // If comparisonYear is provided, filter by that year, otherwise get all
    try {
      const url = comparisonYear 
        ? `${API_BASE_URL}/routes/comparison?year=${comparisonYear}`
        : `${API_BASE_URL}/routes/comparison`;
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch comparison');
      }

      const comparisonsData = await response.json();
      
      // Backend returns an array of ComparisonData objects
      // Convert each to RouteComparison format
      return comparisonsData.map((comparisonData: any) => {
        // Find the route to get vesselType and fuelType for baseline
        const baselineRouteData = allRoutes.find(r => r.routeId === comparisonData.baseline.routeId) || baselineRoute;
        
        return {
          baseline: {
            routeId: comparisonData.baseline.routeId,
            vesselType: baselineRouteData.vesselType,
            fuelType: baselineRouteData.fuelType,
            year: comparisonData.baseline.year,
            ghgIntensity: comparisonData.baseline.ghgIntensity,
            fuelConsumption: comparisonData.baseline.fuelConsumption,
            distance: comparisonData.baseline.distance,
            totalEmissions: comparisonData.baseline.totalEmissions,
            isBaseline: true,
          },
          comparison: {
            routeId: comparisonData.comparison.routeId,
            vesselType: comparisonData.comparison.vesselType,
            fuelType: comparisonData.comparison.fuelType,
            year: comparisonData.comparison.year,
            ghgIntensity: comparisonData.comparison.ghgIntensity,
            fuelConsumption: comparisonData.comparison.fuelConsumption,
            distance: comparisonData.comparison.distance,
            totalEmissions: comparisonData.comparison.totalEmissions,
            isBaseline: comparisonData.comparison.isBaseline || false,
          },
          percentDifference: comparisonData.percentDifference,
          complianceStatus: comparisonData.isCompliant ? 'compliant' : 'non-compliant',
          targetIntensity: comparisonData.complianceTarget || TARGET_INTENSITY,
        };
      });
    } catch (error: any) {
      console.error('Error fetching comparison from API:', error);
      // Fallback to client-side comparison if API fails
      const baselineRoute = allRoutes.find(r => r.isBaseline);
      if (!baselineRoute) {
        return [];
      }
      
      const routesToCompare = comparisonYear 
        ? allRoutes.filter(r => r.year === comparisonYear)
        : allRoutes;
      
      return routesToCompare.map(route => {
        const percentDifference = ((route.ghgIntensity / baselineRoute.ghgIntensity) - 1) * 100;
        const complianceStatus = route.ghgIntensity <= TARGET_INTENSITY ? 'compliant' : 'non-compliant';
        
        return {
          baseline: baselineRoute,
          comparison: route,
          percentDifference,
          complianceStatus,
          targetIntensity: TARGET_INTENSITY,
        };
      });
    }
  }

  async filterRoutes(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    const allRoutes = await this.getAllRoutes();
    let filtered = [...allRoutes];

    if (filters.vesselType) {
      filtered = filtered.filter(r => 
        r.vesselType.toLowerCase().includes(filters.vesselType!.toLowerCase())
      );
    }
    if (filters.fuelType) {
      filtered = filtered.filter(r => 
        r.fuelType.toLowerCase().includes(filters.fuelType!.toLowerCase())
      );
    }
    if (filters.year) {
      filtered = filtered.filter(r => r.year === filters.year);
    }

    return filtered;
  }
}

