
import React from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { Badge } from '@/components/ui/badge';
import { Globe, TestTube } from 'lucide-react';

export const NetworkIndicator: React.FC = () => {
  const { network, isConnected } = useWallet();

  if (!isConnected) return null;

  return (
    <Badge 
      variant="outline" 
      className={`text-xs border-2 ${
        network === 'Mainnet' 
          ? 'border-green-500 text-green-400 bg-green-500/10' 
          : 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
      }`}
    >
      {network === 'Mainnet' ? (
        <Globe className="w-3 h-3 mr-1" />
      ) : (
        <TestTube className="w-3 h-3 mr-1" />
      )}
      {network}
    </Badge>
  );
};
