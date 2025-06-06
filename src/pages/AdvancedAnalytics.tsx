
import { TechnicalIndicatorsPanel } from "@/components/advanced/TechnicalIndicatorsPanel"
import { AdvancedAnalyticsPanel } from "@/components/advanced/AdvancedAnalyticsPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function AdvancedAnalytics() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
            <p className="text-gray-400 mt-2">
              Professional-grade analytics with real market data, technical indicators, and risk metrics
            </p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AdvancedAnalyticsPanel />
          </TabsContent>

          <TabsContent value="technical" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TechnicalIndicatorsPanel />
              </div>
              <div className="space-y-6">
                {/* Additional technical analysis components can go here */}
                <TechnicalIndicatorsPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-6">
            <AdvancedAnalyticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
