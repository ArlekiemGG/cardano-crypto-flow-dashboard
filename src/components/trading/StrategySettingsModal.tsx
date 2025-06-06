
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface StrategySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: {
    id: string;
    name: string;
    strategy_type: string;
    config_json: any;
  };
  onUpdateStrategy: (strategyId: string, updates: Record<string, any>) => void;
}

export const StrategySettingsModal = ({ 
  isOpen, 
  onClose, 
  strategy,
  onUpdateStrategy 
}: StrategySettingsModalProps) => {
  const [name, setName] = useState(strategy.name);
  const [pair, setPair] = useState(strategy.config_json?.pair || 'ADA/USDC');
  const [budget, setBudget] = useState(strategy.config_json?.budget?.toString() || '1000');
  const [description, setDescription] = useState(strategy.config_json?.description || '');

  const handleSave = () => {
    const updates = {
      name,
      config_json: {
        ...strategy.config_json,
        pair,
        budget: parseFloat(budget),
        description
      }
    };

    onUpdateStrategy(strategy.id, updates);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Strategy Settings</DialogTitle>
          <DialogDescription>
            Configure your trading strategy parameters.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="strategy-name">Strategy Name</Label>
            <Input
              id="strategy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Strategy name"
            />
          </div>
          
          <div>
            <Label htmlFor="trading-pair">Trading Pair</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADA/USDC">ADA/USDC</SelectItem>
                <SelectItem value="ADA/BTC">ADA/BTC</SelectItem>
                <SelectItem value="ADA/ETH">ADA/ETH</SelectItem>
                <SelectItem value="ADA/USD">ADA/USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="strategy-budget">Budget (ADA)</Label>
            <Input
              id="strategy-budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="1000"
            />
          </div>
          
          <div>
            <Label htmlFor="strategy-description">Description</Label>
            <Textarea
              id="strategy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Strategy description..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
