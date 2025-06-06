import { useState } from "react"
import { MetricCard } from "@/components/MetricCard"
import { Bot, Play, Pause, Settings, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { useTradingStrategies } from "@/hooks/useTradingStrategies"
import { CreateStrategyModal } from "@/components/trading/CreateStrategyModal"
import { StrategySettingsModal } from "@/components/trading/StrategySettingsModal"
import { useWallet } from "@/contexts/ModernWalletContext"

export default function TradingStrategies() {
  const { address } = useWallet();
  const { strategies, isLoading, createStrategy, updateStrategy, deleteStrategy, toggleStrategy } = useTradingStrategies(address);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedStrategyForSettings, setSelectedStrategyForSettings] = useState<any>(null);

  // Calculate metrics from real strategies
  const activeStrategies = strategies.filter(s => s.active).length;
  const totalProfit = strategies.reduce((sum, s) => sum + (s.profit_loss || 0), 0);
  const totalTrades = strategies.reduce((sum, s) => sum + (s.total_trades || 0), 0);
  const successRate = totalTrades > 0 ? 
    ((strategies.filter(s => (s.profit_loss || 0) > 0).length / strategies.length) * 100).toFixed(1) : 
    "0.0";

  const strategyTemplates = [
    { 
      name: "DCA Strategy", 
      type: "DCA",
      description: "Dollar Cost Averaging", 
      difficulty: "Beginner",
      defaultConfig: { interval: "daily", amount: 50 }
    },
    { 
      name: "Grid Trading", 
      type: "Grid",
      description: "Buy low, sell high in grids", 
      difficulty: "Intermediate",
      defaultConfig: { gridSize: 10, spacing: 0.01 }
    },
    { 
      name: "Mean Reversion", 
      type: "MeanReversion",
      description: "Statistical arbitrage", 
      difficulty: "Advanced",
      defaultConfig: { period: 20, threshold: 2 }
    },
  ];

  const handleCreateStrategy = (name: string, type: string, config: Record<string, any>) => {
    createStrategy(name, type as any, config);
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsCreateModalOpen(true);
  };

  const handleOpenSettings = (strategy: any) => {
    setSelectedStrategyForSettings(strategy);
    setIsSettingsModalOpen(true);
  };

  const handleUpdateStrategy = (strategyId: string, updates: Record<string, any>) => {
    updateStrategy(strategyId, updates);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    console.log('=== COMPONENT DELETE HANDLER CALLED ===');
    console.log('Strategy ID to delete:', strategyId);
    console.log('Available deleteStrategy function:', typeof deleteStrategy);
    
    if (typeof deleteStrategy === 'function') {
      console.log('Calling deleteStrategy function...');
      deleteStrategy(strategyId);
    } else {
      console.error('deleteStrategy is not a function!', deleteStrategy);
    }
  };

  const handleToggleStrategy = (strategyId: string) => {
    toggleStrategy(strategyId);
  };

  const formatProfit = (profit: number) => {
    const sign = profit >= 0 ? '+' : '';
    return `${sign}₳ ${profit.toFixed(2)}`;
  };

  if (!address) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view and manage your trading strategies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Strategies</h1>
          <p className="text-gray-400 mt-2">Manage and configure your automated trading bots</p>
        </div>
        <Button 
          className="mt-4 lg:mt-0 bg-gradient-to-r from-crypto-primary to-crypto-secondary hover:from-crypto-secondary hover:to-crypto-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Strategies"
          value={activeStrategies.toString()}
          change={`${strategies.length} total`}
          changeType="neutral"
          icon={Bot}
          gradient="gradient-primary"
        />
        
        <MetricCard
          title="Total Profit"
          value={formatProfit(totalProfit)}
          change={totalProfit >= 0 ? "Profitable" : "At Loss"}
          changeType={totalProfit >= 0 ? "positive" : "negative"}
          icon={Play}
          gradient="gradient-profit"
        />
        
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          change={`${strategies.filter(s => (s.profit_loss || 0) > 0).length} profitable`}
          changeType="positive"
          icon={Settings}
          gradient="gradient-success"
        />
        
        <MetricCard
          title="Total Trades"
          value={totalTrades.toString()}
          change={`${strategies.length} strategies`}
          changeType="positive"
          icon={Plus}
          gradient="gradient-secondary"
        />
      </div>

      {/* Strategy List */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Your Strategies</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading strategies...</p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No trading strategies found</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Strategy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="glass rounded-lg p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      strategy.active 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-gray-500/20 border border-gray-500/30'
                    }`}>
                      <Bot className={`h-6 w-6 ${
                        strategy.active ? 'text-green-400' : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div>
                      <h3 className="text-white font-semibold text-lg">{strategy.name}</h3>
                      <p className="text-gray-400">
                        {strategy.config_json?.pair || 'ADA/USDC'} • {strategy.total_trades} trades
                      </p>
                      <p className="text-gray-500 text-sm">
                        Created: {new Date(strategy.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-bold font-mono ${
                        (strategy.profit_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatProfit(strategy.profit_loss || 0)}
                      </p>
                      <p className={`text-sm ${
                        strategy.active ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {strategy.active ? 'Active' : 'Paused'}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* Settings Button - Fixed styling */}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => handleOpenSettings(strategy)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      
                      {/* Delete Button - Added */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => {
                              console.log('Delete button clicked for strategy:', strategy.id, strategy.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{strategy.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => {
                                console.log('Delete confirmation clicked for strategy:', strategy.id);
                                handleDeleteStrategy(strategy.id);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {/* Play/Pause Button - Enhanced with proper tooltip */}
                      <Button 
                        size="sm"
                        className={strategy.active 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        }
                        onClick={() => handleToggleStrategy(strategy.id)}
                        title={strategy.active ? 'Pause strategy execution' : 'Start strategy execution'}
                      >
                        {strategy.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Templates */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Strategy Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {strategyTemplates.map((template, index) => (
            <div key={index} className="glass rounded-lg p-6 hover:bg-white/5 transition-colors cursor-pointer">
              <h3 className="text-white font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  template.difficulty === 'Beginner' 
                    ? 'bg-green-500/20 text-green-400' 
                    : template.difficulty === 'Intermediate'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {template.difficulty}
                </span>
                <Button 
                  size="sm" 
                  className="bg-crypto-primary hover:bg-crypto-secondary"
                  onClick={() => handleUseTemplate(template)}
                >
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateStrategyModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTemplate(null);
        }}
        onCreateStrategy={handleCreateStrategy}
        selectedTemplate={selectedTemplate}
      />

      {selectedStrategyForSettings && (
        <StrategySettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            setSelectedStrategyForSettings(null);
          }}
          strategy={selectedStrategyForSettings}
          onUpdateStrategy={handleUpdateStrategy}
        />
      )}
    </div>
  )
}
