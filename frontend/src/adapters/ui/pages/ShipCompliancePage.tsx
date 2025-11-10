import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "../components/DataTable";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";
import { ShipCompliance } from "@/core/domain/models/ShipCompliance";
import { ShipComplianceUseCases } from "@/core/application/usecases/ShipComplianceUseCases";
import { HttpShipComplianceRepository } from "@/adapters/infrastructure/api/HttpShipComplianceRepository";
import { formatNumber } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { Ship, Calculator, Search, List, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const shipComplianceUseCases = new ShipComplianceUseCases(new HttpShipComplianceRepository());

export function ShipCompliancePage() {
  const [year, setYear] = useState<number>(2024);
  const [activeView, setActiveView] = useState<"search" | "list" | "compute">("search");
  
  // Search view state
  const [searchShipId, setSearchShipId] = useState<string>("");
  const [searchYear, setSearchYear] = useState<number>(2024);
  const [searchResult, setSearchResult] = useState<ShipCompliance | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // List view state
  const [allShips, setAllShips] = useState<ShipCompliance[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // Compute view state
  const [computeShipId, setComputeShipId] = useState<string>("");
  const [computeYear, setComputeYear] = useState<number>(2024);
  const [computeRouteId, setComputeRouteId] = useState<string>("");
  const [isComputing, setIsComputing] = useState(false);
  const [computeResult, setComputeResult] = useState<ShipCompliance | null>(null);

  // Load all ships when year changes in list view
  useEffect(() => {
    if (activeView === "list") {
      loadAllShips();
    }
  }, [year, activeView]);

  const loadAllShips = async () => {
    setIsLoadingList(true);
    try {
      console.log('Loading ships for year:', year);
      const data = await shipComplianceUseCases.getAllShipCompliance(year);
      console.log('Received data:', data);
      setAllShips(data || []);
      if (data && data.length > 0) {
        console.log(`Successfully loaded ${data.length} ships`);
      } else {
        console.log('No ships found for year', year);
      }
    } catch (error) {
      console.error('Error loading ships:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load ship compliance list",
        variant: "destructive",
      });
      setAllShips([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSearch = async () => {
    if (!searchShipId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a ship ID",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for ship:', searchShipId, 'year:', searchYear);
      const result = await shipComplianceUseCases.getShipCompliance(searchShipId.trim(), searchYear);
      console.log('Search result:', result);
      setSearchResult(result);
      if (!result) {
        toast({
          title: "Not Found",
          description: `No compliance data found for ship ${searchShipId} in year ${searchYear}`,
          variant: "destructive",
        });
      } else {
        console.log('Found compliance data:', result);
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search ship compliance",
        variant: "destructive",
      });
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCompute = async () => {
    if (!computeShipId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a ship ID",
        variant: "destructive",
      });
      return;
    }

    setIsComputing(true);
    try {
      const result = await shipComplianceUseCases.computeComplianceBalance({
        shipId: computeShipId.trim(),
        year: computeYear,
        routeId: computeRouteId.trim() || computeShipId.trim(), // Use shipId as routeId if not provided
      });
      setComputeResult(result);
      toast({
        title: "Success",
        description: `Compliance balance computed successfully for ship ${computeShipId}`,
      });
      // Refresh list if we're on list view
      if (activeView === "list") {
        await loadAllShips();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to compute compliance balance",
        variant: "destructive",
      });
      setComputeResult(null);
    } finally {
      setIsComputing(false);
    }
  };

  const getComplianceStatus = (cb: number): 'surplus' | 'deficit' | 'neutral' => {
    if (cb > 0) return 'surplus';
    if (cb < 0) return 'deficit';
    return 'neutral';
  };

  const shipComplianceColumns = [
    {
      header: "Ship ID",
      accessor: (row: ShipCompliance) => row.shipId,
    },
    {
      header: "Year",
      accessor: (row: ShipCompliance) => row.year,
    },
    {
      header: "Compliance Balance",
      accessor: (row: ShipCompliance) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{formatNumber(row.cbGco2eq)} gCO₂e</span>
          <ComplianceStatusBadge status={getComplianceStatus(row.cbGco2eq)} />
        </div>
      ),
    },
    {
      header: "Last Updated",
      accessor: (row: ShipCompliance) => {
        const date = row.updatedAt;
        return date ? new Date(date).toLocaleDateString() : "N/A";
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ship Compliance Management</h2>
        <p className="text-muted-foreground">
          View and compute compliance balances for individual ships
        </p>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            <span>Search Ship</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span>All Ships</span>
          </TabsTrigger>
          <TabsTrigger value="compute" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span>Compute CB</span>
          </TabsTrigger>
        </TabsList>

        {/* Search View */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Ship Compliance</CardTitle>
              <CardDescription>
                Get compliance balance for a specific ship and year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-ship-id">Ship ID</Label>
                  <Input
                    id="search-ship-id"
                    placeholder="e.g., R001, R002"
                    value={searchShipId}
                    onChange={(e) => setSearchShipId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-year">Year</Label>
                  <Input
                    id="search-year"
                    type="number"
                    value={searchYear}
                    onChange={(e) => setSearchYear(parseInt(e.target.value) || 2024)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {searchResult && (
                <Card className="mt-4 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ship className="h-5 w-5" />
                      Ship {searchResult.shipId} - {searchResult.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Compliance Balance</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold font-mono">
                            {formatNumber(searchResult.cbGco2eq)} gCO₂e
                          </span>
                          <ComplianceStatusBadge status={getComplianceStatus(searchResult.cbGco2eq)} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          {getComplianceStatus(searchResult.cbGco2eq) === 'surplus' && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Compliant (Surplus)
                            </Badge>
                          )}
                          {getComplianceStatus(searchResult.cbGco2eq) === 'deficit' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Non-Compliant (Deficit)
                            </Badge>
                          )}
                          {getComplianceStatus(searchResult.cbGco2eq) === 'neutral' && (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Neutral
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {searchResult.updatedAt && (
                      <div>
                        <Label className="text-muted-foreground">Last Updated</Label>
                        <p className="text-sm mt-1">
                          {new Date(searchResult.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Ship Compliance - {year}</CardTitle>
              <CardDescription>
                View compliance balances for all ships in a given year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1 max-w-xs">
                  <Label htmlFor="list-year">Year</Label>
                  <Input
                    id="list-year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={loadAllShips} disabled={isLoadingList}>
                    <List className="h-4 w-4 mr-2" />
                    {isLoadingList ? "Loading..." : "Refresh"}
                  </Button>
                </div>
              </div>

              {isLoadingList ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : allShips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ship compliance data found for year {year}
                </div>
              ) : (
                <DataTable columns={shipComplianceColumns} data={allShips} />
              )}

              {allShips.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Showing {allShips.length} ship{allShips.length !== 1 ? 's' : ''} for year {year}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compute View */}
        <TabsContent value="compute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compute Compliance Balance</CardTitle>
              <CardDescription>
                Calculate and save compliance balance for a ship based on route data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="compute-ship-id">Ship ID *</Label>
                  <Input
                    id="compute-ship-id"
                    placeholder="e.g., R001, R002"
                    value={computeShipId}
                    onChange={(e) => setComputeShipId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compute-year">Year *</Label>
                  <Input
                    id="compute-year"
                    type="number"
                    value={computeYear}
                    onChange={(e) => setComputeYear(parseInt(e.target.value) || 2024)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compute-route-id">Route ID (optional)</Label>
                  <Input
                    id="compute-route-id"
                    placeholder="Leave empty to use Ship ID"
                    value={computeRouteId}
                    onChange={(e) => setComputeRouteId(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleCompute} disabled={isComputing} className="w-full md:w-auto">
                <Calculator className="h-4 w-4 mr-2" />
                {isComputing ? "Computing..." : "Compute Compliance Balance"}
              </Button>

              {computeResult && (
                <Card className="mt-4 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Computation Successful
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Ship ID</Label>
                        <p className="text-lg font-semibold mt-1">{computeResult.shipId}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Year</Label>
                        <p className="text-lg font-semibold mt-1">{computeResult.year}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Compliance Balance</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold font-mono">
                            {formatNumber(computeResult.cbGco2eq)} gCO₂e
                          </span>
                          <ComplianceStatusBadge status={getComplianceStatus(computeResult.cbGco2eq)} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

