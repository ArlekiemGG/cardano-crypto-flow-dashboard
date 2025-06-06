
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, AlertTriangle, TrendingDown, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const RiskManagementTools = () => {
  const [maxExposure, setMaxExposure] = useState(10000);
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [stopLossThreshold, setStopLossThreshold] = useState(5);
  const [impermanentLossAlert, setImpermanentLossAlert] = useState(3);
  const [autoRebalance, setAutoRebalance] = useState(false);

  const riskMetrics = {
    currentExposure: 25430,
    maxDrawdown: -3.2,
    sharpeRatio: 1.8,
    volatility: 12.5,
    correlation: 0.65
  };

  const getRiskLevel = (exposure: number) => {
    const exposureRatio = exposure / maxExposure;
    if (exposureRatio < 0.5) return { level: 'Low', color: 'bg-green-500' };
    if (exposureRatio < 0.8) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'High', color: 'bg-red-500' };
  };

  const risk = getRiskLevel(riskMetrics.currentExposure);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-crypto-accent" />
          <span>Risk Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Overview */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-crypto-accent/10 to-crypto-loss/10 border border-crypto-accent/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Current Risk Level</h4>
            <Badge className={`${risk.color} text-white`}>
              {risk.level}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Exposure</p>
              <p className="text-white font-mono">₳ {riskMetrics.currentExposure.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 mb-1">Max Drawdown</p>
              <p className="text-red-400 font-mono">{riskMetrics.maxDrawdown}%</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 mb-1">Sharpe Ratio</p>
              <p className="text-green-400 font-mono">{riskMetrics.sharpeRatio}</p>
            </div>
          </div>
        </div>

        {/* Risk Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="maxExposure" className="text-white">Maximum Exposure (ADA)</Label>
            <Input
              id="maxExposure"
              type="number"
              value={maxExposure}
              onChange={(e) => setMaxExposure(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <Label className="text-white">Stop Loss Protection</Label>
              <p className="text-xs text-gray-400">Automatically close positions on losses</p>
            </div>
            <Switch
              checked={stopLossEnabled}
              onCheckedChange={setStopLossEnabled}
            />
          </div>

          {stopLossEnabled && (
            <div>
              <Label htmlFor="stopLoss" className="text-white">Stop Loss Threshold (%)</Label>
              <Input
                id="stopLoss"
                type="number"
                value={stopLossThreshold}
                onChange={(e) => setStopLossThreshold(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white"
                min="1"
                max="20"
              />
            </div>
          )}

          <div>
            <Label htmlFor="ilAlert" className="text-white">Impermanent Loss Alert (%)</Label>
            <Input
              id="ilAlert"
              type="number"
              value={impermanentLossAlert}
              onChange={(e) => setImpermanentLossAlert(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
              min="1"
              max="10"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <Label className="text-white">Auto Rebalancing</Label>
              <p className="text-xs text-gray-400">Maintain optimal portfolio balance</p>
            </div>
            <Switch
              checked={autoRebalance}
              onCheckedChange={setAutoRebalance}
            />
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="space-y-2">
          <div className="flex items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-yellow-400 text-sm">
              High correlation detected between ADA/USDC and ADA/DJED positions
            </span>
          </div>

          <div className="flex items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <TrendingDown className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-red-400 text-sm">
              Impermanent loss threshold exceeded on MIN/ADA position
            </span>
          </div>
        </div>

        <Button className="w-full bg-crypto-accent hover:bg-crypto-accent/90">
          <Settings className="h-4 w-4 mr-2" />
          Apply Risk Settings
        </Button>
      </CardContent>
    </Card>
  );
};
