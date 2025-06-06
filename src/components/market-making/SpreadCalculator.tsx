import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";
import { useSpreadCalculations } from "@/hooks/useSpreadCalculations";

export const SpreadCalculator = () => {
  const [selectedPair, setSelectedPair] = useState("ADA/USDC");
  const [amount, setAmount] = useState<number>(1000);
  const [calculation, setCalculation] = useState<any>(null);
  const { calculateSpread } = useSpreadCalculations();

  const availablePairs = [
    "ADA/USDC",
    "ADA/DJED", 
    "MIN/ADA",
    "SNEK/ADA",
    "HOSKY/ADA",
    "COPI/ADA"
  ];

  const handleCalculate = () => {
    if (amount && selectedPair) {
      const result = calculateSpread(selectedPair, amount);
      setCalculation(result);
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-crypto-primary" />
          <span>Spread Calculator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="amount" className="text-white">Amount (ADA)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <Button 
          onClick={handleCalculate}
          className="w-full bg-crypto-primary hover:bg-crypto-primary/90"
          disabled={!amount || !selectedPair}
        >
          Calculate Spread & Profit
        </Button>

        {calculation && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-crypto-primary/10 to-crypto-secondary/10 border border-crypto-primary/20">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-crypto-primary" />
              Calculation Results
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Buy Price:</span>
                  <span className="text-white font-mono">${calculation.buyPrice.toFixed(6)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Sell Price:</span>
                  <span className="text-white font-mono">${calculation.sellPrice.toFixed(6)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Spread:</span>
                  <span className="text-white font-mono">${calculation.spread.toFixed(6)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spread %:</span>
                  <span className="text-crypto-primary font-mono font-bold">
                    {calculation.spreadPercentage.toFixed(3)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Profit:</span>
                  <span className="text-green-400 font-mono font-bold">
                    ₳ {calculation.estimatedProfit.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily Est.:</span>
                  <span className="text-green-400 font-mono">
                    ₳ {(calculation.estimatedProfit * 24).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
