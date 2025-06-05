
import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnector } from './WalletConnector';
import { Loader2, Shield, Wallet } from 'lucide-react';

interface WalletGuardProps {
  children: React.ReactNode;
  requireMinimumBalance?: number;
}

export const WalletGuard: React.FC<WalletGuardProps> = ({ 
  children, 
  requireMinimumBalance 
}) => {
  const { isConnected, isConnecting, checkMinimumBalance, balance } = useWallet();

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-crypto-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connecting Wallet...</h2>
          <p className="text-gray-400">Please wait while we establish connection</p>
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
            Connect Your Cardano Wallet
          </h1>
          
          <p className="text-gray-400 mb-8">
            You need to connect a Cardano wallet to access this trading platform. 
            Your wallet will be used for authentication and real blockchain transactions.
          </p>

          <div className="mb-6">
            <WalletConnector />
          </div>

          <div className="text-sm text-gray-500 space-y-2">
            <p>✅ No email or password required</p>
            <p>✅ Secure blockchain authentication</p>
            <p>✅ Direct access to your ADA</p>
            <p>✅ Support for all major Cardano wallets</p>
          </div>
        </div>
      </div>
    );
  }

  // Check minimum balance if required
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
            You need at least {requireMinimumBalance} ADA in your wallet to access this feature.
          </p>

          <div className="bg-black/40 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Current Balance:</span>
              <span className="text-white font-mono">₳ {balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Required:</span>
              <span className="text-yellow-400 font-mono">₳ {requireMinimumBalance}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Please add more ADA to your wallet and refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // Wallet is connected and requirements are met
  return <>{children}</>;
};
