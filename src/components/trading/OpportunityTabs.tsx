
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpportunityTable } from './OpportunityTable';

interface Opportunity {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercentage: number;
  profitADA: number;
  volumeAvailable: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  executionReady: boolean;
}

interface OpportunityTabsProps {
  opportunities: Opportunity[];
  executableOpportunities: Opportunity[];
  highConfidenceCount: number;
  onExecute: (id: string) => void;
  executingTrades: Set<string>;
}

export const OpportunityTabs = ({
  opportunities,
  executableOpportunities,
  highConfidenceCount,
  onExecute,
  executingTrades
}: OpportunityTabsProps) => {
  const highConfidenceOpportunities = opportunities.filter(opp => opp.confidence === 'HIGH');

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white/5">
        <TabsTrigger value="all">All ({opportunities.length})</TabsTrigger>
        <TabsTrigger value="executable">Executable ({executableOpportunities.length})</TabsTrigger>
        <TabsTrigger value="high-confidence">High Confidence ({highConfidenceCount})</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-6">
        <OpportunityTable 
          opportunities={opportunities}
          onExecute={onExecute}
          executingTrades={executingTrades}
        />
      </TabsContent>

      <TabsContent value="executable" className="mt-6">
        <OpportunityTable 
          opportunities={executableOpportunities}
          onExecute={onExecute}
          executingTrades={executingTrades}
        />
      </TabsContent>

      <TabsContent value="high-confidence" className="mt-6">
        <OpportunityTable 
          opportunities={highConfidenceOpportunities}
          onExecute={onExecute}
          executingTrades={executingTrades}
        />
      </TabsContent>
    </Tabs>
  );
};
