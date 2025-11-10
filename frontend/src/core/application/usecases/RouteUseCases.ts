import { IRouteRepository } from '../../ports/repositories/IRouteRepository';
import { Route, RouteComparison } from '../../domain/models/Route';

export class RouteUseCases {
  constructor(private routeRepository: IRouteRepository) {}

  async getAllRoutes(): Promise<Route[]> {
    return await this.routeRepository.getAllRoutes();
  }

  async setRouteAsBaseline(routeId: string): Promise<void> {
    await this.routeRepository.setBaseline(routeId);
  }

  async getRouteComparison(baselineYear: number, comparisonYear: number): Promise<RouteComparison[]> {
    return await this.routeRepository.getComparison(baselineYear, comparisonYear);
  }

  async getComparison(baselineYear: number, comparisonYear: number): Promise<RouteComparison[]> {
    return await this.routeRepository.getComparison(baselineYear, comparisonYear);
  }

  async filterRoutes(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    return await this.routeRepository.filterRoutes(filters);
  }

  calculateComplianceStatus(ghgIntensity: number, targetIntensity: number): 'compliant' | 'non-compliant' {
    return ghgIntensity <= targetIntensity ? 'compliant' : 'non-compliant';
  }

  calculatePercentDifference(baseline: number, comparison: number): number {
    return ((comparison / baseline) - 1) * 100;
  }
}
