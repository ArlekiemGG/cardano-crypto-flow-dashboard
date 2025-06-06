
import React from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { Loader2 } from 'lucide-react';

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

  // If not connected, let the parent component (Index) handle showing the welcome screen
  if (!isConnected) {
    return null;
  }

  // Wallet is connected - allow access
  return <>{children}</>;
};
