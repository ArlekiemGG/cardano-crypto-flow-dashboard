
import React from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { ModernWalletConnector } from './ModernWalletConnector';
import { Loader2, Shield, Wallet, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMinimumBalance?: number;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireMinimumBalance = 100 // Default 100 ADA for premium access
}) => {
  const { 
    isConnected, 
    isConnecting, 
    checkMinimumBalance, 
    balance, 
    walletName,
    lastUpdate 
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
            Connect your Cardano wallet to access this premium trading platform. 
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
            <p>✅ Premium access (100 ADA min)</p>
          </div>
        </div>
      </div>
    );
  }

  // Check minimum balance for premium access
  if (requireMinimumBalance && !checkMinimumBalance(requireMinimumBalance)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="max-w-md w-full text-center glass rounded-2xl p-8 border border-yellow-500/30">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Premium Access Required
          </h1>
          
          <p className="text-gray-400 mb-6">
            You need at least {requireMinimumBalance} ADA in your wallet to access premium trading features.
          </p>

          <div className="bg-black/40 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Connected Wallet:</span>
              <span className="text-white font-medium">{walletName}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Current Balance:</span>
              <span className="text-white font-mono">₳ {balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Required:</span>
              <span className="text-yellow-400 font-mono">₳ {requireMinimumBalance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Last Update:</span>
              <span className="text-gray-300 text-xs">
                {lastUpdate?.toLocaleTimeString() || 'Never'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center text-yellow-400 mb-4">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="text-sm">Insufficient balance for premium access</span>
          </div>

          <p className="text-sm text-gray-500">
            Add more ADA to your wallet and the balance will update automatically within 30 seconds.
          </p>
        </div>
      </div>
    );
  }

  // Wallet is connected and requirements are met
  return <>{children}</>;
};
