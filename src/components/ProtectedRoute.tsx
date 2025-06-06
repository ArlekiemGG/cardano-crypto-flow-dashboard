
import React, { useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Redirect to home page when wallet is disconnected
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      console.log('Wallet disconnected, redirecting to home page');
      navigate('/');
    }
  }, [isConnected, isConnecting, navigate]);

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

  // If not connected, redirect will happen via useEffect above
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-crypto-primary animate-spin mb-4" />
          <p className="text-gray-400">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  // Wallet is connected - allow access without premium requirements
  return <>{children}</>;
};
