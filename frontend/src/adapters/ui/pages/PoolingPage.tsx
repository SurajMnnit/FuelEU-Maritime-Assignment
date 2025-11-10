import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "../components/DataTable";
import { StatCard } from "../components/StatCard";
import { ShipCompliance } from "@/core/domain/models/ShipCompliance";
import { Pool } from "@/core/domain/models/Pool";
import { AdjustedComplianceBalance } from "@/core/domain/models/Compliance";
import { ShipComplianceUseCases } from "@/core/application/usecases/ShipComplianceUseCases";
import { PoolUseCases } from "@/core/application/usecases/PoolUseCases";
import { ComplianceUseCases } from "@/core/application/usecases/ComplianceUseCases";
import { HttpShipComplianceRepository } from "@/adapters/infrastructure/api/HttpShipComplianceRepository";
import { HttpPoolRepository } from "@/adapters/infrastructure/api/HttpPoolRepository";
import { HttpComplianceRepository } from "@/adapters/infrastructure/api/HttpComplianceRepository";
import { formatNumber } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Ship,
  Building2,
  Target,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Info
} from "lucide-react";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";

const shipComplianceUseCases = new ShipComplianceUseCases(new HttpShipComplianceRepository());
const poolUseCases = new PoolUseCases(new HttpPoolRepository());
const complianceUseCases = new ComplianceUseCases(new HttpComplianceRepository());

type PoolingMode = "strategic" | "fleet";

export function PoolingPage() {
  const [year, setYear] = useState<number>(2024);
  const [poolingMode, setPoolingMode] = useState<PoolingMode>("strategic");
  const [ships, setShips] = useState<AdjustedComplianceBalance[]>([]);
  const [selectedShips, setSelectedShips] = useState<Set<string>>(new Set());
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPools, setIsLoadingPools] = useState(false);
  const [poolName, setPoolName] = useState<string>("");

  useEffect(() => {
    loadShips();
    loadPools();
  }, [year]);

  const loadShips = async () => {
    setIsLoading(true);
    try {
      // Use adjusted compliance balances for pooling (this is what pool creation uses)
      const data = await complianceUseCases.getAdjustedComplianceBalances(year);
      setShips(data);
      // Auto-select all ships for fleet mode
      if (poolingMode === "fleet" && data.length > 0) {
        setSelectedShips(new Set(data.map(s => s.shipId)));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load ships",
        variant: "destructive",
      });
      setShips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPools = async () => {
    setIsLoadingPools(true);
    try {
      const data = await poolUseCases.getAllPools();
      setPools(data);
    } catch (error) {
      console.error("Error loading pools:", error);
      setPools([]);
    } finally {
      setIsLoadingPools(false);
    }
  };

  const handleModeChange = (mode: PoolingMode) => {
    setPoolingMode(mode);
    if (mode === "fleet" && ships.length > 0) {
      // Auto-select all ships for fleet mode
      setSelectedShips(new Set(ships.map(s => s.shipId)));
    } else {
      // Clear selection for strategic mode
      setSelectedShips(new Set());
    }
  };

  const handleToggleShip = (shipId: string) => {
    const newSelected = new Set(selectedShips);
    if (newSelected.has(shipId)) {
      newSelected.delete(shipId);
    } else {
      newSelected.add(shipId);
    }
    setSelectedShips(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedShips.size === ships.length) {
      setSelectedShips(new Set());
    } else {
      setSelectedShips(new Set(ships.map(s => s.shipId)));
    }
  };

  const selectedMembers = ships.filter(s => selectedShips.has(s.shipId));
  const totalCB = selectedMembers.reduce((sum, ship) => sum + ship.adjustedCB, 0);
  const avgCB = selectedMembers.length > 0 ? totalCB / selectedMembers.length : 0;
  const surplusShips = selectedMembers.filter(s => s.adjustedCB >= 0);
  const deficitShips = selectedMembers.filter(s => s.adjustedCB < 0);
  
  // Validate Article 21 rules:
  // 1. Deficit ship cannot exit worse (avgCB >= cbBefore for deficit ships)
  // 2. Surplus ship cannot exit negative (avgCB >= 0 for surplus ships)
  const violatesArticle21 = selectedMembers.some(ship => {
    const isDeficit = ship.adjustedCB < 0;
    const isSurplus = ship.adjustedCB > 0;
    return (isDeficit && avgCB < ship.adjustedCB) || (isSurplus && avgCB < 0);
  });
  
  const canCreate = totalCB >= 0 && selectedMembers.length >= 1 && poolName.trim() !== "" && !violatesArticle21;

  const getComplianceStatus = (cb: number): 'surplus' | 'deficit' | 'neutral' => {
    if (cb > 0) return 'surplus';
    if (cb < 0) return 'deficit';
    return 'neutral';
  };

  // Convert AdjustedComplianceBalance to display format
  const shipsForDisplay = ships.map(s => ({
    shipId: s.shipId,
    shipName: s.shipName,
    cbGco2eq: s.adjustedCB,
  }));

  const handleCreatePool = async () => {
    if (!canCreate) {
      toast({
        title: "Cannot Create Pool",
        description: selectedMembers.length < 1 
          ? "Select at least 1 ship" 
          : totalCB < 0 
          ? "Total CB must be non-negative" 
          : "Enter pool name",
        variant: "destructive",
      });
      return;
    }

    try {
      const pool = await poolUseCases.createPool({
        name: poolName,
        year,
        shipIds: Array.from(selectedShips),
      });
      
      toast({
        title: "Pool Created Successfully",
        description: `Pool "${pool.name}" created with ${pool.members.length} ships. Total CB: ${formatNumber(pool.totalCB)} gCO₂e`,
      });
      
      setSelectedShips(new Set());
      setPoolName("");
      await loadPools();
      await loadShips();
    } catch (error) {
      toast({
        title: "Error Creating Pool",
        description: error instanceof Error ? error.message : "Failed to create pool",
        variant: "destructive",
      });
    }
  };

  const shipColumns = [
    {
      header: "Select",
      accessor: (row: { shipId: string; shipName: string; cbGco2eq: number }) => (
        <Checkbox
          checked={selectedShips.has(row.shipId)}
          onCheckedChange={() => handleToggleShip(row.shipId)}
        />
      ),
    },
    {
      header: "Ship ID",
      accessor: (row: { shipId: string; shipName: string; cbGco2eq: number }) => (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{row.shipId}</span>
        </div>
      ),
    },
    {
      header: "Adjusted CB",
      accessor: (row: { shipId: string; shipName: string; cbGco2eq: number }) => (
        <div className="flex items-center gap-2">
          <span className={`font-mono font-semibold ${row.cbGco2eq >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatNumber(row.cbGco2eq)} gCO₂e
          </span>
          <ComplianceStatusBadge status={getComplianceStatus(row.cbGco2eq)} />
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row: { shipId: string; shipName: string; cbGco2eq: number }) => {
        const status = getComplianceStatus(row.cbGco2eq);
        return (
          <Badge 
            variant={status === 'surplus' ? 'default' : status === 'deficit' ? 'destructive' : 'secondary'}
            className={status === 'surplus' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {status === 'surplus' ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Compliant
              </>
            ) : status === 'deficit' ? (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Non-Compliant
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Neutral
              </>
            )}
          </Badge>
        );
      },
    },
  ];

  const poolColumns = [
    {
      header: "Pool ID",
      accessor: (row: Pool) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm">{row.poolId}</span>
        </div>
      ),
    },
    {
      header: "Name",
      accessor: (row: Pool) => (
        <span className="font-semibold">
          {row.name || `Pool ${row.poolId}`}
        </span>
      ),
    },
    {
      header: "Year",
      accessor: (row: Pool) => row.year,
    },
    {
      header: "Members",
      accessor: (row: Pool) => (
        <Badge variant="outline">
          {row.members.length} ship{row.members.length !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      header: "Total CB",
      accessor: (row: Pool) => (
        <span className={`font-mono font-semibold ${row.totalCB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatNumber(row.totalCB)} gCO₂e
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: Pool) => (
        <Badge variant={row.isValid ? 'default' : 'destructive'}>
          {row.isValid ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Valid
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Invalid
            </>
          )}
        </Badge>
      ),
    },
    {
      header: "Created",
      accessor: (row: Pool) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const poolMemberColumns = [
    {
      header: "Ship ID",
      accessor: (member: Pool['members'][0]) => (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{member.shipId}</span>
        </div>
      ),
    },
    {
      header: "CB Before",
      accessor: (member: Pool['members'][0]) => (
        <span className={`font-mono font-semibold ${member.cbBeforePool >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatNumber(member.cbBeforePool)} gCO₂e
        </span>
      ),
    },
    {
      header: "→",
      accessor: () => (
        <div className="flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
    },
    {
      header: "CB After",
      accessor: (member: Pool['members'][0]) => (
        <span className={`font-mono font-semibold ${member.cbAfterPool >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatNumber(member.cbAfterPool)} gCO₂e
        </span>
      ),
    },
    {
      header: "Change",
      accessor: (member: Pool['members'][0]) => {
        const change = member.cbAfterPool - member.cbBeforePool;
        const isImprovement = change > 0 || (member.cbBeforePool < 0 && member.cbAfterPool > member.cbBeforePool);
        return (
          <div className="flex items-center gap-2">
            {isImprovement ? (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : change < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <span className="h-4 w-4" />
            )}
            <span className={`font-mono font-semibold ${isImprovement ? 'text-green-600 dark:text-green-400' : change < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
              {change >= 0 ? '+' : ''}{formatNumber(change)} gCO₂e
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: (member: Pool['members'][0]) => {
        const status = getComplianceStatus(member.cbAfterPool);
        return (
          <ComplianceStatusBadge status={status} />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Compliance Pooling</h2>
        <p className="text-muted-foreground mt-2">
          Create pools to share compliance balance among multiple vessels
        </p>
      </div>

      <Tabs value={poolingMode} onValueChange={(v) => handleModeChange(v as PoolingMode)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="strategic" className="gap-2">
            <Target className="h-4 w-4" />
            Strategic Pooling
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-2">
            <Building2 className="h-4 w-4" />
            Fleet Management
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Users className="h-4 w-4" />
            Pool History
          </TabsTrigger>
        </TabsList>

        {/* Strategic Pooling Tab */}
        <TabsContent value="strategic" className="space-y-6">
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Strategic Pooling
              </CardTitle>
              <CardDescription>
                Select 2-3 specific ships to create a targeted compliance pool. Ideal for pairing ships with surpluses and deficits.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="year-select">Year</Label>
              <Input
                id="year-select"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                className="w-32"
              />
            </div>
            <Button onClick={loadShips} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Selected Ships"
              value={selectedShips.size}
              description={poolingMode === "strategic" ? "Select 2-3 ships" : "All fleet ships"}
              icon={Users}
              className={selectedShips.size >= 2 ? 'border-green-500' : ''}
            />
            <StatCard
              title="Total CB"
              value={formatNumber(totalCB)}
              description={totalCB >= 0 ? "Valid for pooling" : "Invalid (negative)"}
              icon={totalCB >= 0 ? TrendingUp : TrendingDown}
              className={totalCB >= 0 ? 'border-green-500' : 'border-red-500'}
            />
            <StatCard
              title="Surplus Ships"
              value={surplusShips.length}
              description={`${formatNumber(surplusShips.reduce((sum, s) => sum + s.adjustedCB, 0))} gCO₂e`}
              icon={CheckCircle2}
              className="border-green-500"
            />
            <StatCard
              title="Deficit Ships"
              value={deficitShips.length}
              description={`${formatNumber(deficitShips.reduce((sum, s) => sum + s.adjustedCB, 0))} gCO₂e`}
              icon={XCircle}
              className="border-red-500"
            />
          </div>

          {selectedMembers.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Pool Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-background rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Current Total</div>
                      <div className="text-2xl font-bold font-mono">{formatNumber(totalCB)} gCO₂e</div>
                    </div>
                    <div className="p-4 bg-background rounded-lg border flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="p-4 bg-background rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">After Pooling (per ship)</div>
                      <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                        {formatNumber(avgCB)} gCO₂e
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Each ship will receive an equal share: {formatNumber(totalCB)} ÷ {selectedMembers.length} = {formatNumber(avgCB)} gCO₂e
                  </div>
                  
                  {/* Member Before/After Preview */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Member Changes Preview:</h4>
                    <div className="space-y-2">
                      {selectedMembers.map((ship) => {
                        const change = avgCB - ship.adjustedCB;
                        const isImprovement = change > 0 || (ship.adjustedCB < 0 && avgCB > ship.adjustedCB);
                        const violatesRule = (ship.adjustedCB < 0 && avgCB < ship.adjustedCB) || (ship.adjustedCB > 0 && avgCB < 0);
                        return (
                          <div 
                            key={ship.shipId} 
                            className={`p-3 rounded-lg border ${violatesRule ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'bg-background'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Ship className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{ship.shipId}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`font-mono text-sm ${ship.adjustedCB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatNumber(ship.adjustedCB)} gCO₂e
                                </span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className={`font-mono text-sm font-semibold ${avgCB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatNumber(avgCB)} gCO₂e
                                </span>
                                {isImprovement ? (
                                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : change < 0 ? (
                                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                ) : null}
                              </div>
                            </div>
                            {violatesRule && (
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {ship.adjustedCB < 0 
                                  ? 'Warning: Deficit ship would exit worse (violates Article 21)'
                                  : 'Warning: Surplus ship would exit negative (violates Article 21)'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Select Ships for Strategic Pool</CardTitle>
              <CardDescription>
                Choose 2-3 ships to create a targeted compliance pool. Select ships with complementary compliance balances.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedShips.size === ships.length && ships.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select All Ships</Label>
                </div>
                <Badge variant="outline">
                  {ships.length} ship{ships.length !== 1 ? 's' : ''} available
                </Badge>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading ships...</div>
              ) : ships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ship compliance data found for year {year}. Compute compliance balances first.
                </div>
              ) : (
                <DataTable data={shipsForDisplay} columns={shipColumns} />
              )}

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="pool-name">Pool Name *</Label>
                  <Input
                    id="pool-name"
                    placeholder="e.g., Strategic Pool R001-R002"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm">
                    {canCreate ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Pool is valid and ready to create</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span>
                          {selectedMembers.length < 1 
                            ? "Select at least 1 ship" 
                            : totalCB < 0 
                            ? "Total CB must be non-negative" 
                            : violatesArticle21
                            ? "Pool violates Article 21 rules (see preview above)"
                            : "Enter pool name"}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleCreatePool} disabled={!canCreate} size="lg">
                    <Users className="h-4 w-4 mr-2" />
                    Create Strategic Pool
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Management Tab */}
        <TabsContent value="fleet" className="space-y-6">
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Fleet Compliance Management
              </CardTitle>
              <CardDescription>
                Pool all ships in your fleet to achieve collective compliance. All ships are automatically selected.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="fleet-year">Year</Label>
              <Input
                id="fleet-year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                className="w-32"
              />
            </div>
            <Button onClick={loadShips} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Fleet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Fleet Size"
              value={ships.length}
              description="Total ships in fleet"
              icon={Ship}
            />
            <StatCard
              title="Fleet Total CB"
              value={formatNumber(totalCB)}
              description={totalCB >= 0 ? "Fleet is compliant" : "Fleet needs pooling"}
              icon={totalCB >= 0 ? TrendingUp : TrendingDown}
              className={totalCB >= 0 ? 'border-green-500' : 'border-red-500'}
            />
            <StatCard
              title="Compliant Ships"
              value={surplusShips.length}
              description={`${surplusShips.length > 0 ? Math.round((surplusShips.length / ships.length) * 100) : 0}% of fleet`}
              icon={CheckCircle2}
              className="border-green-500"
            />
            <StatCard
              title="Non-Compliant Ships"
              value={deficitShips.length}
              description={`${deficitShips.length > 0 ? Math.round((deficitShips.length / ships.length) * 100) : 0}% of fleet`}
              icon={XCircle}
              className="border-red-500"
            />
          </div>

          {selectedMembers.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Fleet Pool Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-background rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Fleet Total CB</div>
                      <div className="text-2xl font-bold font-mono">{formatNumber(totalCB)} gCO₂e</div>
                    </div>
                    <div className="p-4 bg-background rounded-lg border flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="p-4 bg-background rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Per Ship After Pooling</div>
                      <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                        {formatNumber(avgCB)} gCO₂e
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    All {selectedMembers.length} ships will share the fleet total equally: {formatNumber(totalCB)} ÷ {selectedMembers.length} = {formatNumber(avgCB)} gCO₂e per ship
                  </div>
                  
                  {/* Member Before/After Preview for Fleet */}
                  {selectedMembers.length <= 10 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-3">Member Changes Preview (showing first 10):</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedMembers.slice(0, 10).map((ship) => {
                          const change = avgCB - ship.adjustedCB;
                          const isImprovement = change > 0 || (ship.adjustedCB < 0 && avgCB > ship.adjustedCB);
                          const violatesRule = (ship.adjustedCB < 0 && avgCB < ship.adjustedCB) || (ship.adjustedCB > 0 && avgCB < 0);
                          return (
                            <div 
                              key={ship.shipId} 
                              className={`p-3 rounded-lg border ${violatesRule ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'bg-background'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Ship className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{ship.shipId}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`font-mono text-sm ${ship.adjustedCB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatNumber(ship.adjustedCB)} gCO₂e
                                  </span>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  <span className={`font-mono text-sm font-semibold ${avgCB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatNumber(avgCB)} gCO₂e
                                  </span>
                                  {isImprovement ? (
                                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  ) : change < 0 ? (
                                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  ) : null}
                                </div>
                              </div>
                              {violatesRule && (
                                <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {ship.adjustedCB < 0 
                                    ? 'Warning: Deficit ship would exit worse (violates Article 21)'
                                    : 'Warning: Surplus ship would exit negative (violates Article 21)'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {selectedMembers.length > 10 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          ... and {selectedMembers.length - 10} more ships
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Fleet Ships ({ships.length} ships)</CardTitle>
              <CardDescription>
                All ships in your fleet for {year}. They will be pooled together to achieve collective compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading fleet data...</div>
              ) : ships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ship compliance data found for year {year}. Compute compliance balances first.
                </div>
              ) : (
                <>
                  <DataTable data={shipsForDisplay} columns={shipColumns} />
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="fleet-pool-name">Fleet Pool Name *</Label>
                      <Input
                        id="fleet-pool-name"
                        placeholder="e.g., 2024 Fleet Compliance Pool"
                        value={poolName}
                        onChange={(e) => setPoolName(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm">
                        {canCreate ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Fleet pool is ready to create</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            <span>
                              {totalCB < 0 
                                ? "Fleet total CB must be non-negative" 
                                : violatesArticle21
                                ? "Pool violates Article 21 rules (see preview above)"
                                : "Enter fleet pool name"}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button onClick={handleCreatePool} disabled={!canCreate} size="lg">
                        <Building2 className="h-4 w-4 mr-2" />
                        Create Fleet Pool
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pool History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pool History
              </CardTitle>
              <CardDescription>
                View all compliance pools that have been created with member details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {pools.length} pool{pools.length !== 1 ? 's' : ''} created
                </div>
                <Button onClick={loadPools} variant="outline" disabled={isLoadingPools} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPools ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoadingPools ? (
                <div className="text-center py-8 text-muted-foreground">Loading pools...</div>
              ) : pools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pools created yet. Create your first pool using Strategic Pooling or Fleet Management.
                </div>
              ) : (
                <div className="space-y-6">
                  <DataTable data={pools} columns={poolColumns} />
                  
                  {/* Detailed Member View for each pool */}
                  {pools.map((pool) => (
                    <Card key={pool.poolId} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>
                            {pool.name || `Pool ${pool.poolId}`} - {pool.members.length} Member{pool.members.length !== 1 ? 's' : ''}
                          </span>
                          <Badge variant={pool.isValid ? 'default' : 'destructive'}>
                            {pool.isValid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Created on {new Date(pool.createdAt).toLocaleDateString()} • 
                          Total Pool CB: <span className={`font-semibold ${pool.totalCB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatNumber(pool.totalCB)} gCO₂e
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold mb-3">Member Details (Before → After Pooling):</h4>
                          <DataTable data={pool.members} columns={poolMemberColumns} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
