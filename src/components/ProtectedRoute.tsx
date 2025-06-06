
import React from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMinimumBalance?: number;
  showConnectionScreen?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireMinimumBalance,
  showConnectionScreen = true
}) => {
  const { 
    isConnected, 
    isConnecting
  } = useWallet();

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-crypto-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connecting Wallet...</h2>
          <p className="text-gray-400">Establishing secure connection via Lucid Evolution</p>
        </div>
      </div>
    );
  }

  // If not connected and we should show connection screen, return null to let parent handle it
  if (!isConnected && !showConnectionScreen) {
    return null;
  }

  // Show default wallet connection required (this shouldn't show when showConnectionScreen=false)
  if (!isConnected && showConnectionScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="max-w-md w-full text-center glass rounded-2xl p-8 border border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-crypto-primary to-crypto-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Cardano Wallet Required
          </h1>
          
          <p className="text-gray-400 mb-8">
            Connect your Cardano wallet to access this trading platform. 
            We use Lucid Evolution for secure blockchain interactions.
          </p>

          <div className="text-sm text-gray-500 space-y-2 bg-black/40 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">2025 Features:</h4>
            <p>✅ Lucid Evolution integration</p>
            <p>✅ Blockfrost API connectivity</p>
            <p>✅ 7 major wallet support</p>
            <p>✅ Auto-balance updates (30s)</p>
            <p>✅ Free access (no minimum balance)</p>
          </div>
        </div>
      </div>
    );
  }

  // Wallet is connected - allow access without premium requirements
  return <>{children}</>;
};
