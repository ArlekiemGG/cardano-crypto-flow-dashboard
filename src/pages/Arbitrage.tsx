
import { RealTimeTradingPanel } from "@/components/RealTimeTradingPanel"
import { DEXConnectionStatus } from "@/components/DEXConnectionStatus"
import { RealTimePortfolio } from "@/components/RealTimePortfolio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Arbitrage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Real-Time Arbitrage Trading</h1>
          <p className="text-gray-400 mt-2">
            Automated arbitrage detection and execution with live DEX data from Cardano ecosystem
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trading" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5">
          <TabsTrigger value="trading">Live Trading</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="connections">DEX Status</TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="mt-6">
          <RealTimeTradingPanel />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <RealTimePortfolio />
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <DEXConnectionStatus />
        </TabsContent>
      </Tabs>
    </div>
  )
}
