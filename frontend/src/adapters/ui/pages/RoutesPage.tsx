import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";
import { Route } from "@/core/domain/models/Route";
import { RouteUseCases } from "@/core/application/usecases/RouteUseCases";
import { HttpRouteRepository } from "@/adapters/infrastructure/api/HttpRouteRepository";
import { formatIntensity, formatFuel, formatDistance, formatEmissions } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { Ship, TrendingUp, Star, CheckCircle2, Filter, RefreshCw, AlertCircle, TrendingDown } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);

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

  // Calculate statistics
  const totalRoutes = filteredRoutes.length;
  const compliantRoutes = filteredRoutes.filter(r => {
    const intensity = typeof r.ghgIntensity === 'number' ? r.ghgIntensity : parseFloat(String(r.ghgIntensity || 0));
    return !isNaN(intensity) && intensity <= 89.3368;
  }).length;
  const nonCompliantRoutes = totalRoutes - compliantRoutes;
  const baselineRoute = routes.find(r => r.isBaseline);
  const avgIntensity = filteredRoutes.length > 0 
    ? filteredRoutes.reduce((sum, r) => {
        const intensity = typeof r.ghgIntensity === 'number' ? r.ghgIntensity : parseFloat(String(r.ghgIntensity || 0));
        return sum + (isNaN(intensity) ? 0 : intensity);
      }, 0) / filteredRoutes.length 
    : 0;

  const columns = [
    {
      header: "Route ID",
      accessor: (row: Route) => (
        <div className="flex items-center gap-3">
          {row.isBaseline ? (
            <div className="p-2 rounded-lg bg-yellow-100">
              <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-primary/10">
              <Ship className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <span className={`font-semibold ${row.isBaseline ? 'text-yellow-700' : 'text-foreground'}`}>
              {row.routeId}
            </span>
            {row.isBaseline && (
              <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700 bg-yellow-50">
                Baseline
              </Badge>
            )}
          </div>
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
            <span className="font-mono font-medium">{formatIntensity(row.ghgIntensity)}</span>
            {!isNaN(intensity) && intensity > 89.3368 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" />
            )}
          </div>
        );
      },
    },
    { header: "Fuel Consumption", accessor: (row: Route) => <span className="font-mono">{formatFuel(row.fuelConsumption)}</span> },
    { header: "Distance", accessor: (row: Route) => <span className="font-mono">{formatDistance(row.distance)}</span> },
    { header: "Total Emissions", accessor: (row: Route) => <span className="font-mono font-medium">{formatEmissions(row.totalEmissions)}</span> },
    {
      header: "Status",
      accessor: (row: Route) => {
        const intensity = typeof row.ghgIntensity === 'number' ? row.ghgIntensity : parseFloat(String(row.ghgIntensity || 0));
        const isCompliant = !isNaN(intensity) && intensity <= 89.3368;
        return (
          <div className="flex items-center gap-2">
            <ComplianceStatusBadge 
              status={isCompliant ? 'compliant' : 'non-compliant'}
            />
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: (row: Route) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant={row.isBaseline ? "secondary" : "default"}
            onClick={() => handleSetBaseline(row.routeId)}
            disabled={row.isBaseline}
            className={row.isBaseline ? "cursor-not-allowed opacity-60" : ""}
          >
            {row.isBaseline ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Active
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                Set Baseline
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Routes</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">{totalRoutes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently filtered routes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Compliant</CardDescription>
            <CardTitle className="text-3xl font-bold text-success">{compliantRoutes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {totalRoutes > 0 ? Math.round((compliantRoutes / totalRoutes) * 100) : 0}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Non-Compliant</CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive">{nonCompliantRoutes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Avg Intensity</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent">{avgIntensity.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">gCO₂e/MJ average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Baseline Info Banner */}
          {baselineRoute && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-400">
                      <Star className="h-5 w-5 text-yellow-900 fill-yellow-900" />
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-900">Current Baseline Route</p>
                      <p className="text-sm text-yellow-700">
                        {baselineRoute.routeId} • {baselineRoute.vesselType} • {baselineRoute.year}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-yellow-600 text-yellow-900 bg-yellow-100">
                    Active Baseline
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({});
                  setShowFilters(false);
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredRoutes.length}</span> of <span className="font-semibold text-foreground">{routes.length}</span> routes
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Routes
                </CardTitle>
                <CardDescription>Refine your route data by selecting filters below</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
              <CardDescription>Comprehensive view of all vessel routes and their compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={filteredRoutes} 
                columns={columns}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={loadRoutes}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </CardContent>
          </Card>

          {/* Compliance Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compliant Routes</span>
                  <span className="font-semibold text-success">{compliantRoutes}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${totalRoutes > 0 ? (compliantRoutes / totalRoutes) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Non-Compliant Routes</span>
                  <span className="font-semibold text-destructive">{nonCompliantRoutes}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-destructive h-2 rounded-full transition-all"
                    style={{ width: `${totalRoutes > 0 ? (nonCompliantRoutes / totalRoutes) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {!baselineRoute && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-warning">No Baseline Set</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set a baseline route to enable comparison features
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
