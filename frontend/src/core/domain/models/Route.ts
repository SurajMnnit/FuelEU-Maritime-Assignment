export interface Route {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number; // gCO₂e/MJ
  fuelConsumption: number; // tons
  distance: number; // nautical miles
  totalEmissions: number; // tons CO₂e
  isBaseline?: boolean;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDifference: number;
  complianceStatus: 'compliant' | 'non-compliant';
  targetIntensity: number;
}
