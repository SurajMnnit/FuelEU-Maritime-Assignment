import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "../components/DataTable";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";
import { RouteComparison, Route } from "@/core/domain/models/Route";
import { RouteUseCases } from "@/core/application/usecases/RouteUseCases";
import { HttpRouteRepository } from "@/adapters/infrastructure/api/HttpRouteRepository";
import { formatIntensity, formatPercentage } from "@/shared/utils/formatting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, TrendingUp, Target, Star, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const routeUseCases = new RouteUseCases(new HttpRouteRepository());

export function ComparePage() {
  const [comparisons, setComparisons] = useState<RouteComparison[]>([]);
  const [baselineYear, setBaselineYear] = useState<number>(2023);
  const [comparisonYear, setComparisonYear] = useState<number>(2024);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineRoute, setBaselineRoute] = useState<Route | null>(null);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (allRoutes.length > 0) {
      loadComparisons();
    }
  }, [baselineYear, comparisonYear, allRoutes]);

  const loadRoutes = async () => {
    try {
      const routes = await routeUseCases.getAllRoutes();
      setAllRoutes(routes);
      const baseline = routes.find(r => r.isBaseline);
      setBaselineRoute(baseline || null);
    } catch (err: any) {
      console.error('Error loading routes:', err);
    }
  };

  const loadComparisons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeUseCases.getRouteComparison(baselineYear, comparisonYear);
      setComparisons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load comparison data');
      setComparisons([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = comparisons.map(c => ({
    name: `${c.comparison.routeId} (${c.comparison.vesselType})`,
    routeId: c.comparison.routeId,
    vesselType: c.comparison.vesselType,
    baseline: c.baseline.ghgIntensity,
    comparison: c.comparison.ghgIntensity,
    target: c.targetIntensity,
  }));

  const columns = [
    { header: "Route ID", accessor: (row: RouteComparison) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">{row.comparison.routeId}</span>
        {row.comparison.isBaseline && (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
            <Star className="h-3 w-3 mr-1" />
            Baseline
          </Badge>
        )}
      </div>
    ) },
    { header: "Vessel Type", accessor: (row: RouteComparison) => row.comparison.vesselType },
    { header: "Year", accessor: (row: RouteComparison) => row.comparison.year },
    {
      header: "Baseline Intensity",
      accessor: (row: RouteComparison) => (
        <span className="font-mono">{formatIntensity(row.baseline.ghgIntensity)}</span>
      ),
    },
    {
      header: "Current Intensity",
      accessor: (row: RouteComparison) => (
        <span className="font-mono">{formatIntensity(row.comparison.ghgIntensity)}</span>
      ),
    },
    {
      header: "Target",
      accessor: (row: RouteComparison) => (
        <span className="font-mono text-muted-foreground">{formatIntensity(row.targetIntensity)}</span>
      ),
    },
    {
      header: "% Difference",
      accessor: (row: RouteComparison) => (
        <div className="flex items-center gap-2">
          {row.percentDifference < 0 ? (
            <TrendingDown className="h-4 w-4 text-success" />
          ) : (
            <TrendingUp className="h-4 w-4 text-destructive" />
          )}
          <span className={row.percentDifference < 0 ? "text-success" : "text-destructive"}>
            {formatPercentage(row.percentDifference)}
          </span>
        </div>
      ),
    },
    {
      header: "Compliance",
      accessor: (row: RouteComparison) => <ComplianceStatusBadge status={row.complianceStatus} />,
    },
  ];

  const avgDifference = comparisons.length > 0
    ? comparisons.reduce((sum, c) => sum + c.percentDifference, 0) / comparisons.length
    : 0;

  const compliantCount = comparisons.filter(c => c.complianceStatus === 'compliant').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Baseline Comparison</h2>
        <p className="text-muted-foreground mt-2">
          Compare current emissions against baseline to track compliance progress
        </p>
        {baselineRoute ? (
          <div className="mt-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-muted-foreground">
              Baseline Route: <Badge variant="outline" className="ml-1">{baselineRoute.routeId}</Badge>
            </span>
          </div>
        ) : (
          <Alert className="mt-3 border-yellow-500">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              No baseline route set. Please go to the <strong>Routes</strong> tab and set a baseline route first.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              {avgDifference < 0 ? (
                <TrendingDown className="h-5 w-5 text-success" />
              ) : (
                <TrendingUp className="h-5 w-5 text-destructive" />
              )}
              <span className={`text-2xl font-bold ${avgDifference < 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(avgDifference)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">
                {compliantCount}/{comparisons.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">
              {formatIntensity(89.3368)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Emissions Intensity Comparison</CardTitle>
              <CardDescription>GHG intensity across vessel types</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Baseline Year</label>
                <Select value={baselineYear.toString()} onValueChange={(v) => setBaselineYear(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Comparison Year</label>
                <Select value={comparisonYear.toString()} onValueChange={(v) => setComparisonYear(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <ReferenceLine 
                y={89.3368} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label="Target"
              />
              <Bar dataKey="baseline" fill="hsl(var(--chart-1))" name="Baseline" />
              <Bar dataKey="comparison" fill="hsl(var(--chart-2))" name="Current" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-sm">
              <strong>Error:</strong> {error}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Make sure a baseline route is set. Go to the Routes tab and set a baseline first.
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Loading comparison data...</div>
          </CardContent>
        </Card>
      ) : comparisons.length === 0 && !error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No comparison data available. Please set a baseline route first.
            </div>
          </CardContent>
        </Card>
      ) : (
        <DataTable data={comparisons} columns={columns} />
      )}
    </div>
  );
}
