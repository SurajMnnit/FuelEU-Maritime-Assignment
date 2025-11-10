export interface Route {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number; // gCO₂e/MJ
  fuelConsumption: number; // MJ
  distance: number; // nautical miles
  totalEmissions: number; // gCO₂e
}

export interface Baseline {
  routeId: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
}

export interface ComparisonData {
  baseline: Baseline;
  comparison: Route;
  percentDifference: number;
  complianceTarget: number; // 89.3368 gCO₂e/MJ
  isCompliant: boolean;
}

