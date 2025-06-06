
import React from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { ModernWalletConnector } from './ModernWalletConnector';
import { Loader2, Wallet } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMinimumBalance?: number;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireMinimumBalance // Not used for now, but kept for future implementation
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

  // Show wallet connection required
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="max-w-md w-full text-center glass rounded-2xl p-8 border border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-crypto-primary to-crypto-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Cardano Wallet Required
          </h1>
          
          <p className="text-gray-400 mb-8">
            Connect your Cardano wallet to access this trading platform. 
            We use Lucid Evolution for secure blockchain interactions.
          </p>

          <div className="mb-6">
            <ModernWalletConnector />
          </div>

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
