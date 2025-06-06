
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/ModernWalletContext";
import { useToast } from "@/hooks/use-toast";

export const WalletSettings = () => {
  const { address, balance, walletName, network, disconnectWallet } = useWallet();
  const { toast } = useToast();

  const handleDisconnectWallet = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "You have been logged out successfully",
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Wallet className="h-6 w-6 text-crypto-primary" />
        <h2 className="text-xl font-semibold text-white">Wallet</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white">Connected Wallet</span>
          <span className="text-green-400 text-sm font-mono">{formatAddress(address || '')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Wallet Type</span>
          <span className="text-crypto-primary text-sm">{walletName || 'Unknown'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Network</span>
          <span className="text-crypto-primary text-sm">{network}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Balance</span>
          <span className="text-white text-sm">{balance.toFixed(2)} ADA</span>
        </div>
        <Button 
          onClick={handleDisconnectWallet}
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
          variant="outline"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </Button>
      </div>
    </div>
  );
};
