
import React, { useEffect } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { useNavigate } from 'react-router-dom';
import { ModernWalletConnector } from '@/components/ModernWalletConnector';
import { TrendingUp, Zap, Shield, BarChart3 } from 'lucide-react';

const WelcomeHero = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-crypto-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-crypto-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-crypto-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-crypto-primary rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Header with logo */}
        <div className="mb-8 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-crypto-primary to-crypto-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl glow">
            <TrendingUp className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 bg-gradient-to-r from-crypto-primary via-white to-crypto-secondary bg-clip-text text-transparent">
            CardanoTrade
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">
            The Future of DeFi Trading
          </p>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Welcome to the Next Generation of 
            <span className="text-crypto-primary"> Cardano Trading</span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Experience cutting-edge arbitrage opportunities, automated market making, 
            and real-time portfolio management on the Cardano blockchain.
          </p>

          {/* Connect Wallet Button */}
          <div className="mb-12 animate-scale-in" style={{ animationDelay: '0.6s' }}>
            <ModernWalletConnector />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="glass rounded-2xl p-6 border border-crypto-primary/20 hover:border-crypto-primary/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-crypto-primary to-crypto-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">Execute trades in milliseconds with our optimized Lucid Evolution integration</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-crypto-secondary/20 hover:border-crypto-secondary/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-crypto-secondary to-crypto-accent rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ultra Secure</h3>
              <p className="text-gray-400 text-sm">Your funds stay in your wallet. We never have access to your private keys</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-crypto-success/20 hover:border-crypto-success/50 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-crypto-success to-crypto-profit rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400 text-sm">Real-time market data and sophisticated trading algorithms</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-primary mb-1">$2.5M+</div>
              <div className="text-sm text-gray-400">Volume Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-secondary mb-1">1,200+</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-success mb-1">7</div>
              <div className="text-sm text-gray-400">Supported Wallets</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center animate-fade-in" style={{ animationDelay: '1.8s' }}>
          <p className="text-gray-500 text-sm">
            🔒 Secure • 🚀 Fast • ⚡ Powerful
          </p>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  // Redirect to dashboard if wallet is connected
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  // Show welcome hero when wallet is not connected
  return <WelcomeHero />;
};

export default Index;
