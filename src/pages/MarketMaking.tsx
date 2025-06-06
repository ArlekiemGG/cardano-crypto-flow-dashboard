
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ActivePositionsTable } from "@/components/market-making/ActivePositionsTable";
import { AddLiquidityModal } from "@/components/market-making/AddLiquidityModal";
import { SpreadCalculator } from "@/components/market-making/SpreadCalculator";
import { RiskManagementTools } from "@/components/market-making/RiskManagementTools";
import { TechnicalIndicatorsPanel } from "@/components/advanced/TechnicalIndicatorsPanel";
import { AdvancedAnalyticsPanel } from "@/components/advanced/AdvancedAnalyticsPanel";
import { useMarketMaking } from "@/hooks/useMarketMaking";
import { Plus, Activity, Calculator, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketMaking() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { positions, isLoading, getTotalStats } = useMarketMaking();
  const stats = getTotalStats();

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Market Making</h1>
            <p className="text-gray-400 mt-2">
              Professional liquidity provision with advanced risk management
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="mt-4 lg:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Liquidity Position
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Liquidity</p>
                <p className="text-2xl font-bold text-white">₳ {stats.totalLiquidity.toFixed(2)}</p>
              </div>
              <Activity className="h-8 w-8 text-crypto-primary" />
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Fees Earned</p>
                <p className="text-2xl font-bold text-green-400">₳ {stats.totalFeesEarned.toFixed(3)}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Average APY</p>
                <p className="text-2xl font-bold text-crypto-accent">{stats.avgAPY.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-crypto-accent" />
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Positions</p>
                <p className="text-2xl font-bold text-white">{stats.totalPositions}</p>
              </div>
              <Shield className="h-8 w-8 text-crypto-secondary" />
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/5">
            <TabsTrigger value="positions">Active Positions</TabsTrigger>
            <TabsTrigger value="calculator">Spread Calculator</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
            <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-6">
            <ActivePositionsTable 
              positions={positions} 
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="calculator" className="mt-6">
            <SpreadCalculator />
          </TabsContent>

          <TabsContent value="risk" className="mt-6">
            <RiskManagementTools />
          </TabsContent>

          <TabsContent value="technical" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TechnicalIndicatorsPanel />
              <div className="space-y-6">
                <TechnicalIndicatorsPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdvancedAnalyticsPanel />
          </TabsContent>
        </Tabs>

        <AddLiquidityModal 
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
