import { Route, Baseline } from '../domain/Route';

export interface RouteRepository {
  findAll(): Promise<Route[]>;
  findByRouteId(routeId: string): Promise<Route | null>;
  saveBaseline(routeId: string, baseline: Baseline): Promise<Baseline>;
  findBaseline(routeId: string, year: number): Promise<Baseline | null>;
}

