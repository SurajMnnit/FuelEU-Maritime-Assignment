import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "../components/StatCard";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";
import { ShipCompliance } from "@/core/domain/models/ShipCompliance";
import { ShipComplianceUseCases } from "@/core/application/usecases/ShipComplianceUseCases";
import { HttpShipComplianceRepository } from "@/adapters/infrastructure/api/HttpShipComplianceRepository";
import { formatNumber } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Ship,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const shipComplianceUseCases = new ShipComplianceUseCases(new HttpShipComplianceRepository());

export function BankingPage() {
  const [year, setYear] = useState<number>(2024);
  const [ships, setShips] = useState<ShipCompliance[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string>("");
  const [selectedShip, setSelectedShip] = useState<ShipCompliance | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShips, setIsLoadingShips] = useState(false);

  useEffect(() => {
    loadShips();
  }, [year]);

  useEffect(() => {
    if (selectedShipId) {
      loadSelectedShipData();
    } else {
      setSelectedShip(null);
      setBankedAmount(0);
    }
  }, [selectedShipId, year]);

  const loadShips = async () => {
    setIsLoadingShips(true);
    try {
      const data = await shipComplianceUseCases.getAllShipCompliance(year);
      setShips(data);
      if (data.length > 0 && !selectedShipId) {
        // Auto-select first ship if none selected
        setSelectedShipId(data[0].shipId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load ships",
        variant: "destructive",
      });
      setShips([]);
    } finally {
      setIsLoadingShips(false);
    }
  };

  const loadSelectedShipData = async () => {
    if (!selectedShipId) return;
    
    setIsLoading(true);
    try {
      // Get ship compliance
      const ship = await shipComplianceUseCases.getShipCompliance(selectedShipId, year);
      setSelectedShip(ship);
      
      // Get banked amount
      const banked = await getBankedAmount(selectedShipId, year);
      setBankedAmount(banked);
    } catch (error) {
      console.error('Error loading ship data:', error);
      setSelectedShip(null);
      setBankedAmount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getBankedAmount = async (shipId: string, year: number): Promise<number> => {
    try {
      const response = await fetch(`/api/banking/banked/${encodeURIComponent(shipId)}/${year}`);
      if (response.ok) {
        const data = await response.json();
        return data.bankedAmount || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const getComplianceStatus = (cb: number): 'surplus' | 'deficit' | 'neutral' => {
    if (cb > 0) return 'surplus';
    if (cb < 0) return 'deficit';
    return 'neutral';
  };

  const handleBank = async () => {
    if (!selectedShipId) {
      toast({
        title: "No Ship Selected",
        description: "Please select a ship first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedShip || selectedShip.cbGco2eq < parseFloat(amount)) {
      toast({
        title: "Insufficient Surplus",
        description: `Ship has ${formatNumber(selectedShip?.cbGco2eq || 0)} gCO₂e surplus. Cannot bank ${formatNumber(parseFloat(amount))} gCO₂e.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/banking/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipId: selectedShipId,
          year: year,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bank surplus');
      }

      const data = await response.json();
      
      toast({
        title: "Surplus Banked",
        description: `Successfully banked ${formatNumber(parseFloat(amount))} gCO₂e for ship ${selectedShipId}`,
      });
      
      setAmount("");
      await loadSelectedShipData();
      await loadShips();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to bank surplus",
        variant: "destructive",
      });
    }
  };

  const handleApply = async () => {
    if (!selectedShipId) {
      toast({
        title: "No Ship Selected",
        description: "Please select a ship first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    if (bankedAmount < parseFloat(amount)) {
      toast({
        title: "Insufficient Banked Surplus",
        description: `Only ${formatNumber(bankedAmount)} gCO₂e available. Cannot apply ${formatNumber(parseFloat(amount))} gCO₂e.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/banking/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipId: selectedShipId,
          year: year,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply banked surplus');
      }

      const data = await response.json();
      
      toast({
        title: "Banked Surplus Applied",
        description: `Successfully applied ${formatNumber(parseFloat(amount))} gCO₂e to ship ${selectedShipId}`,
      });
      
      setAmount("");
      await loadSelectedShipData();
      await loadShips();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply banked surplus",
        variant: "destructive",
      });
    }
  };

  const canBank = selectedShip && selectedShip.cbGco2eq > 0;
  const canApply = bankedAmount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Banking & Borrowing</h2>
        <p className="text-muted-foreground mt-2">
          Bank surplus compliance balance or apply banked credits for individual ships
        </p>
      </div>

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
        <div className="space-y-2 flex-1 max-w-xs">
          <Label htmlFor="ship-select">Select Ship</Label>
          <Select 
            value={selectedShipId} 
            onValueChange={(value) => setSelectedShipId(value)}
            disabled={isLoadingShips}
          >
            <SelectTrigger id="ship-select">
              <SelectValue placeholder="Select a ship" />
            </SelectTrigger>
            <SelectContent>
              {ships.map((ship) => (
                <SelectItem key={ship.shipId} value={ship.shipId}>
                  {ship.shipId} - {formatNumber(ship.cbGco2eq)} gCO₂e
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <Button onClick={loadShips} variant="outline" disabled={isLoadingShips}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingShips ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {selectedShip && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Ship Compliance Balance"
              value={formatNumber(selectedShip.cbGco2eq)}
              description={getComplianceStatus(selectedShip.cbGco2eq)}
              icon={Wallet}
              className={
                selectedShip.cbGco2eq > 0 ? 'border-green-500' :
                selectedShip.cbGco2eq < 0 ? 'border-red-500' : ''
              }
            />
            <StatCard
              title="Banked Amount"
              value={formatNumber(bankedAmount)}
              description="Available to apply"
              icon={DollarSign}
              className={bankedAmount > 0 ? 'border-blue-500' : ''}
            />
            <StatCard
              title="Can Bank"
              value={canBank ? "Yes" : "No"}
              description={canBank ? "Surplus available" : "No surplus"}
              icon={TrendingUp}
              className={canBank ? 'border-green-500' : ''}
            />
            <StatCard
              title="Can Apply"
              value={canApply ? "Yes" : "No"}
              description={canApply ? "Banked surplus available" : "No banked surplus"}
              icon={TrendingDown}
              className={canApply ? 'border-blue-500' : ''}
            />
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Ship {selectedShip.shipId} - {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Compliance Balance</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-2xl font-bold font-mono ${selectedShip.cbGco2eq >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatNumber(selectedShip.cbGco2eq)} gCO₂e
                    </span>
                    <ComplianceStatusBadge status={getComplianceStatus(selectedShip.cbGco2eq)} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Banked Surplus</Label>
                  <div className="mt-1">
                    <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                      {formatNumber(bankedAmount)} gCO₂e
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getComplianceStatus(selectedShip.cbGco2eq) === 'surplus' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Compliant (Surplus)
                      </Badge>
                    )}
                    {getComplianceStatus(selectedShip.cbGco2eq) === 'deficit' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Non-Compliant (Deficit)
                      </Badge>
                    )}
                    {getComplianceStatus(selectedShip.cbGco2eq) === 'neutral' && (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Neutral
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              Bank Surplus
            </CardTitle>
            <CardDescription>
              Save positive compliance balance for future use. The amount will be deducted from the ship's CB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedShip ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a ship to bank surplus</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bank-amount">Amount to Bank (gCO₂e)</Label>
                  <Input
                    id="bank-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!canBank}
                    min="0"
                    max={selectedShip.cbGco2eq}
                  />
                  {selectedShip && (
                    <p className="text-xs text-muted-foreground">
                      Available: {formatNumber(selectedShip.cbGco2eq)} gCO₂e
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleBank}
                  disabled={!canBank || !amount || parseFloat(amount) <= 0}
                  className="w-full"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Bank Surplus
                </Button>
                {!canBank && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Banking requires a positive compliance balance. This ship has {formatNumber(selectedShip.cbGco2eq)} gCO₂e.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Apply Banked Surplus
            </CardTitle>
            <CardDescription>
              Use banked surplus to cover deficit. The amount will be added to the ship's CB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedShip ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a ship to apply banked surplus</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apply-amount">Amount to Apply (gCO₂e)</Label>
                  <Input
                    id="apply-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!canApply}
                    min="0"
                    max={bankedAmount}
                  />
                  {bankedAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Available: {formatNumber(bankedAmount)} gCO₂e
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleApply}
                  disabled={!canApply || !amount || parseFloat(amount) <= 0}
                  className="w-full"
                  variant="secondary"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Apply Banked Surplus
                </Button>
                {!canApply && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      No banked surplus available for this ship. Bank surplus first to use it later.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {ships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Ships - {year}</CardTitle>
            <CardDescription>
              View compliance balances for all ships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ships.map((ship) => (
                <Card 
                  key={ship.shipId}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedShipId === ship.shipId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedShipId(ship.shipId)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{ship.shipId}</span>
                      </div>
                      <ComplianceStatusBadge status={getComplianceStatus(ship.cbGco2eq)} />
                    </div>
                    <div className={`text-lg font-bold font-mono ${ship.cbGco2eq >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatNumber(ship.cbGco2eq)} gCO₂e
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
