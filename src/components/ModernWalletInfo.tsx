
import React from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  ExternalLink, 
  LogOut, 
  RefreshCw, 
  Shield, 
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ModernWalletInfo: React.FC = () => {
  const { 
    address, 
    balance, 
    walletName, 
    disconnectWallet, 
    refreshBalance,
    checkMinimumBalance,
    network,
    lastUpdate,
    isConnected
  } = useWallet();
  const { toast } = useToast();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openCardanoScan = () => {
    const baseUrl = network === 'Mainnet' 
      ? 'https://cardanoscan.io' 
      : 'https://testnet.cardanoscan.io';
    window.open(`${baseUrl}/address/${address}`, '_blank');
  };

  const hasPremiumAccess = checkMinimumBalance(100);

  if (!isConnected || !address) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="glass border border-crypto-primary/30 text-crypto-primary hover:bg-crypto-primary/10 text-sm"
          size="sm"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <Wallet className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">
            {formatAddress(address)}
          </span>
          <span className="md:hidden">Connected</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 glass border border-white/20 bg-black/90 backdrop-blur-xl">
        <DropdownMenuLabel className="text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>{walletName} Wallet</span>
            </div>
            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
              {network}
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="border-white/10" />
        
        {/* Balance Info */}
        <div className="p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Balance</span>
            <div className="text-right">
              <div className="text-lg font-mono text-white">
                ₳ {balance.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                ${(balance * 0.63).toFixed(2)} USD
              </div>
            </div>
          </div>

          {/* Premium Access Status */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
            <div className="flex items-center space-x-2">
              {hasPremiumAccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Premium Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">Need 100 ADA</span>
                </>
              )}
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${hasPremiumAccess ? 'border-green-500/50 text-green-400' : 'border-yellow-500/50 text-yellow-400'}`}
            >
              {hasPremiumAccess ? 'PREMIUM' : 'STANDARD'}
            </Badge>
          </div>

          {/* Last Update */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Last update: {lastUpdate?.toLocaleTimeString() || 'Never'}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="border-white/10" />

        {/* Actions */}
        <DropdownMenuItem 
          onClick={() => copyToClipboard(address, 'Address')}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={openCardanoScan}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on CardanoScan
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={refreshBalance}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Balance
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-white/10" />

        <DropdownMenuItem 
          onClick={disconnectWallet}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
