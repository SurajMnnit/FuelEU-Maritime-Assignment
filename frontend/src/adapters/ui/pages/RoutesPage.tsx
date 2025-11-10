import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";
import { Route } from "@/core/domain/models/Route";
import { RouteUseCases } from "@/core/application/usecases/RouteUseCases";
import { HttpRouteRepository } from "@/adapters/infrastructure/api/HttpRouteRepository";
import { formatIntensity, formatFuel, formatDistance, formatEmissions } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { Ship, TrendingUp, Star, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const routeUseCases = new RouteUseCases(new HttpRouteRepository());

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [routes, filters]);

  const loadRoutes = async () => {
    const data = await routeUseCases.getAllRoutes();
    setRoutes(data);
  };

  const applyFilters = async () => {
    const filtered = await routeUseCases.filterRoutes(filters);
    setFilteredRoutes(filtered);
  };

  const handleSetBaseline = async (routeId: string) => {
    try {
      // Check if this route is already the baseline
      const currentRoute = routes.find(r => r.routeId === routeId);
      if (currentRoute?.isBaseline) {
        toast({
          title: "Already Baseline",
          description: `Route ${routeId} is already set as baseline.`,
        });
        return;
      }

      await routeUseCases.setRouteAsBaseline(routeId);
      await loadRoutes();
      toast({
        title: "Baseline Set",
        description: `Route ${routeId} has been set as baseline. Previous baseline has been unset.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set baseline",
        variant: "destructive",
      });
    }
  };

  const vesselTypes = [...new Set(routes.map(r => r.vesselType))];
  const fuelTypes = [...new Set(routes.map(r => r.fuelType))];
  const years = [...new Set(routes.map(r => r.year))];

  const columns = [
    {
      header: "Route ID",
      accessor: (row: Route) => (
        <div className="flex items-center gap-2">
          {row.isBaseline ? (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <Ship className="h-4 w-4 text-primary" />
          )}
          <span className={`font-medium ${row.isBaseline ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
            {row.routeId}
          </span>
          {row.isBaseline && (
            <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700 dark:text-yellow-400">
              Baseline
            </Badge>
          )}
        </div>
      ),
    },
    { header: "Vessel Type", accessor: "vesselType" as keyof Route },
    { header: "Fuel Type", accessor: "fuelType" as keyof Route },
    { header: "Year", accessor: "year" as keyof Route },
    {
      header: "GHG Intensity",
      accessor: (row: Route) => {
        const intensity = typeof row.ghgIntensity === 'number' ? row.ghgIntensity : parseFloat(String(row.ghgIntensity || 0));
        return (
          <div className="flex items-center gap-2">
            {formatIntensity(row.ghgIntensity)}
            {!isNaN(intensity) && intensity > 89.3368 && <TrendingUp className="h-4 w-4 text-destructive" />}
          </div>
        );
      },
    },
    { header: "Fuel Consumption", accessor: (row: Route) => formatFuel(row.fuelConsumption) },
    { header: "Distance", accessor: (row: Route) => formatDistance(row.distance) },
    { header: "Total Emissions", accessor: (row: Route) => formatEmissions(row.totalEmissions) },
    {
      header: "Status",
      accessor: (row: Route) => {
        const intensity = typeof row.ghgIntensity === 'number' ? row.ghgIntensity : parseFloat(String(row.ghgIntensity || 0));
        const isCompliant = !isNaN(intensity) && intensity <= 89.3368;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {row.isBaseline && (
              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <Star className="h-3 w-3 mr-1" />
                Baseline
              </Badge>
            )}
            <ComplianceStatusBadge 
              status={isCompliant ? 'compliant' : 'non-compliant'}
              className="text-xs"
            />
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: (row: Route) => (
        <Button
          size="sm"
          variant={row.isBaseline ? "secondary" : "default"}
          onClick={() => handleSetBaseline(row.routeId)}
          disabled={row.isBaseline}
          className={row.isBaseline ? "cursor-not-allowed" : ""}
        >
          {row.isBaseline ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Is Baseline
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-1" />
              Set Baseline
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Routes Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage vessel routes and set baseline emissions for compliance tracking
        </p>
      </div>

      <FilterBar
        filters={[
          {
            label: "Vessel Type",
            value: filters.vesselType,
            options: vesselTypes.map(v => ({ label: v, value: v })),
            onChange: (value) => setFilters({ ...filters, vesselType: value }),
          },
          {
            label: "Fuel Type",
            value: filters.fuelType,
            options: fuelTypes.map(f => ({ label: f, value: f })),
            onChange: (value) => setFilters({ ...filters, fuelType: value }),
          },
          {
            label: "Year",
            value: filters.year?.toString(),
            options: years.map(y => ({ label: y.toString(), value: y.toString() })),
            onChange: (value) => setFilters({ ...filters, year: value ? parseInt(value) : undefined }),
          },
        ]}
        onReset={() => setFilters({})}
      />

      {routes.length > 0 && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">Current Baseline Route:</span>
            {routes.find(r => r.isBaseline) ? (
              <>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  {routes.find(r => r.isBaseline)?.routeId}
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">
                  (Click "Set Baseline" on another route to change it)
                </span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">None set</span>
                <span className="text-xs text-muted-foreground italic ml-2">
                  (Select a route and click "Set Baseline" to set one)
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <DataTable 
        data={filteredRoutes} 
        columns={columns}
      />
    </div>
  );
}
