
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealMarketMakingPositions } from "@/hooks/useRealMarketMakingPositions";
import { useOptimizedMarketData } from "@/hooks/useOptimizedMarketData";
import { realCardanoDEXService } from "@/services/realCardanoDEXService";

interface AddLiquidityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddLiquidityModal = ({ open, onOpenChange, onSuccess }: AddLiquidityModalProps) => {
  const [selectedPair, setSelectedPair] = useState("ADA/USDC");
  const [selectedDex, setSelectedDex] = useState("Minswap");
  const [tokenAAmount, setTokenAAmount] = useState<number>(0);
  const [tokenBAmount, setTokenBAmount] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const { addLiquidity, isLoading } = useRealMarketMakingPositions();
  const { getADAPrice } = useOptimizedMarketData();

  const availablePairs = [
    "ADA/USDC",
    "ADA/DJED", 
    "MIN/ADA",
    "SNEK/ADA",
    "HOSKY/ADA",
    "COPI/ADA"
  ];

  const availableDEXs = realCardanoDEXService.getSupportedDEXs();

  // Estimate transaction fee when DEX changes
  useEffect(() => {
    const estimateFee = async () => {
      if (!selectedDex) return;
      
      setIsEstimating(true);
      try {
        const fee = await realCardanoDEXService.estimateTransactionFee(selectedDex, 'add_liquidity');
        setEstimatedFee(fee);
      } catch (error) {
        console.error('Error estimating fee:', error);
        setEstimatedFee(0.5); // Fallback fee
      } finally {
        setIsEstimating(false);
      }
    };

    estimateFee();
  }, [selectedDex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenAAmount || !tokenBAmount) return;

    const adaPrice = getADAPrice();
    const priceA = selectedPair.startsWith('ADA') ? adaPrice : 1.0;
    const priceB = selectedPair.endsWith('ADA') ? adaPrice : 1.0;

    try {
      await addLiquidity(
        selectedPair,
        selectedDex,
        tokenAAmount,
        tokenBAmount,
        priceA,
        priceB
      );
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setTokenAAmount(0);
      setTokenBAmount(0);
    } catch (error) {
      console.error('Error adding liquidity:', error);
    }
  };

  const estimatedValue = () => {
    const adaPrice = getADAPrice();
    const valueA = selectedPair.startsWith('ADA') ? tokenAAmount * adaPrice : tokenAAmount;
    const valueB = selectedPair.endsWith('ADA') ? tokenBAmount * adaPrice : tokenBAmount;
    return valueA + valueB;
  };

  const totalCost = () => {
    return estimatedValue() + estimatedFee;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add Liquidity Position</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pair" className="text-white">Trading Pair</Label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dex" className="text-white">DEX</Label>
              <Select value={selectedDex} onValueChange={setSelectedDex}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDEXs.map((dex) => (
                    <SelectItem key={dex} value={dex}>
                      {dex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tokenA" className="text-white">
                {selectedPair.split('/')[0]} Amount
              </Label>
              <Input
                id="tokenA"
                type="number"
                value={tokenAAmount || ''}
                onChange={(e) => setTokenAAmount(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="tokenB" className="text-white">
                {selectedPair.split('/')[1]} Amount
              </Label>
              <Input
                id="tokenB"
                type="number"
                value={tokenBAmount || ''}
                onChange={(e) => setTokenBAmount(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {(tokenAAmount > 0 || tokenBAmount > 0) && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <div className="text-sm text-gray-400 mb-2">Transaction Summary</div>
              
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Liquidity Value:</span>
                <span className="text-crypto-primary font-mono">
                  ${estimatedValue().toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Network Fee:</span>
                <span className="text-orange-400 font-mono">
                  {isEstimating ? '...' : `${estimatedFee.toFixed(2)} ADA`}
                </span>
              </div>
              
              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total Cost:</span>
                  <span className="text-crypto-primary font-mono font-bold">
                    ${totalCost().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-blue-400">
              🔒 This will create a real on-chain transaction on {selectedDex}. 
              Make sure you have sufficient ADA for network fees.
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={!tokenAAmount || !tokenBAmount || isLoading || isEstimating}
              className="flex-1 bg-crypto-primary hover:bg-crypto-primary/90"
            >
              {isLoading ? "Processing..." : "Add Liquidity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
