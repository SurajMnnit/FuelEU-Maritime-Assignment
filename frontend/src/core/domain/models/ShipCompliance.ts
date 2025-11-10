export interface ShipCompliance {
  id?: number;
  shipId: string;
  year: number;
  cbGco2eq: number; // Compliance Balance in gCO₂e
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComputeCBRequest {
  shipId: string;
  year: number;
  routeId?: string;
}

