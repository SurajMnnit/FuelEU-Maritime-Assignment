import { Route, RouteComparison } from '../../domain/models/Route';

export interface IRouteRepository {
  getAllRoutes(): Promise<Route[]>;
  getRouteById(routeId: string): Promise<Route | null>;
  setBaseline(routeId: string): Promise<void>;
  getComparison(baselineYear: number, comparisonYear: number): Promise<RouteComparison[]>;
  filterRoutes(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]>;
}
