
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CreateStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStrategy: (name: string, type: string, config: Record<string, any>) => void;
  selectedTemplate?: {
    name: string;
    type: string;
    defaultConfig: Record<string, any>;
  };
}

export const CreateStrategyModal = ({ 
  isOpen, 
  onClose, 
  onCreateStrategy, 
  selectedTemplate 
}: CreateStrategyModalProps) => {
  const [name, setName] = useState(selectedTemplate?.name || '');
  const [strategyType, setStrategyType] = useState(selectedTemplate?.type || '');
  const [pair, setPair] = useState('ADA/USDC');
  const [budget, setBudget] = useState('1000');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name || !strategyType) return;

    const config = {
      pair,
      budget: parseFloat(budget),
      description,
      ...selectedTemplate?.defaultConfig
    };

    onCreateStrategy(name, strategyType, config);
    onClose();
    
    // Reset form
    setName('');
    setStrategyType('');
    setPair('ADA/USDC');
    setBudget('1000');
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Trading Strategy</DialogTitle>
          <DialogDescription>
            Configure your automated trading strategy with the parameters below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Strategy Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Trading Strategy"
            />
          </div>
          
          <div>
            <Label htmlFor="type">Strategy Type</Label>
            <Select value={strategyType} onValueChange={setStrategyType}>
              <SelectTrigger>
                <SelectValue placeholder="Select strategy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DCA">DCA (Dollar Cost Averaging)</SelectItem>
                <SelectItem value="Grid">Grid Trading</SelectItem>
                <SelectItem value="MeanReversion">Mean Reversion</SelectItem>
                <SelectItem value="Momentum">Momentum</SelectItem>
                <SelectItem value="Arbitrage">Arbitrage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="pair">Trading Pair</Label>
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
            <Label htmlFor="budget">Budget (ADA)</Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="1000"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your strategy..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name || !strategyType}>
              Create Strategy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
