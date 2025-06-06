
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SystemMonitorDashboard } from '@/components/production/SystemMonitorDashboard';
import { SecurityDashboard } from '@/components/production/SecurityDashboard';
import { 
  Activity, 
  Shield, 
  BarChart3, 
  Settings,
  AlertTriangle
} from 'lucide-react';

export default function ProductionDashboard() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Production Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Real-time monitoring and management for production environment
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 lg:mt-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Production Environment</span>
          </div>
        </div>

        {/* Production Tabs */}
        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5">
            <TabsTrigger value="monitor" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>System Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuration</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="mt-6">
            <SystemMonitorDashboard />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Performance Analytics</h3>
              <p className="text-gray-400">
                Advanced performance metrics and optimization tools
              </p>
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Production Configuration</h3>
              <p className="text-gray-400">
                Environment variables and production settings management
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
