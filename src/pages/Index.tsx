
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ModernWalletConnector } from '@/components/ModernWalletConnector';
import { useWallet } from '@/contexts/ModernWalletContext';
import { Wallet, TrendingUp, Shield, Zap, Globe, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WelcomeHero = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-crypto-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-crypto-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-crypto-accent/10 rounded-full blur-3xl animate-float"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMTAwIDAgTCAwIDAgMCAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="mb-8 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-crypto-primary to-crypto-secondary rounded-2xl p-6 mb-6 glow animate-float">
                <Wallet className="w-full h-full text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-crypto-success rounded-full flex items-center justify-center animate-pulse">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
              Cardano
            </span>{' '}
            <span className="text-white">DeFi</span>
            <br />
            <span className="text-crypto-accent">Trading Hub</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Únete a la nueva era del trading descentralizado en Cardano. 
            <span className="text-crypto-primary font-semibold"> Arbitraje automatizado</span>, 
            <span className="text-crypto-secondary font-semibold"> market making</span> y 
            <span className="text-crypto-accent font-semibold"> estrategias avanzadas</span> al alcance de tu mano.
          </p>

          {/* CTA Button */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <ModernWalletConnector />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="glass rounded-xl p-6 border border-crypto-primary/20 hover:border-crypto-primary/40 transition-all duration-300 group hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-crypto-primary to-crypto-secondary rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Arbitraje Inteligente</h3>
              <p className="text-gray-400 text-sm">Detecta y ejecuta oportunidades de arbitraje automáticamente entre DEXs de Cardano</p>
            </div>

            <div className="glass rounded-xl p-6 border border-crypto-secondary/20 hover:border-crypto-secondary/40 transition-all duration-300 group hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-crypto-secondary to-crypto-accent rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Seguridad Total</h3>
              <p className="text-gray-400 text-sm">Lucid Evolution y Blockfrost API para máxima seguridad en tus transacciones</p>
            </div>

            <div className="glass rounded-xl p-6 border border-crypto-accent/20 hover:border-crypto-accent/40 transition-all duration-300 group hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-crypto-accent to-crypto-profit rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Trading Avanzado</h3>
              <p className="text-gray-400 text-sm">Market making profesional con gestión de riesgo automática</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-crypto-primary mb-1">7+</div>
              <div className="text-sm text-gray-400">Wallets Soportadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-crypto-secondary mb-1">4+</div>
              <div className="text-sm text-gray-400">DEXs Integrados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-crypto-accent mb-1">24/7</div>
              <div className="text-sm text-gray-400">Monitoreo Activo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-crypto-profit mb-1">0%</div>
              <div className="text-sm text-gray-400">Comisión Plataforma</div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <p className="text-gray-400 mb-4">¿Listo para empezar?</p>
            <div className="flex items-center justify-center space-x-2 text-crypto-primary">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Conecta tu wallet y comienza a generar ganancias</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-crypto-primary rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '4s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-crypto-secondary rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-crypto-accent rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-crypto-profit rounded-full animate-float" style={{ animationDelay: '3s', animationDuration: '4s' }}></div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <WelcomeHero />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              ¡Bienvenido a Cardano DeFi Trading Hub!
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Tu wallet está conectada. Explora las funciones de trading avanzado.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Button 
                className="h-20 glass border border-crypto-primary/30 hover:border-crypto-primary/50 text-white flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/arbitrage'}
              >
                <TrendingUp className="w-6 h-6 text-crypto-primary" />
                <span>Arbitraje</span>
              </Button>
              
              <Button 
                className="h-20 glass border border-crypto-secondary/30 hover:border-crypto-secondary/50 text-white flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/market-making'}
              >
                <Shield className="w-6 h-6 text-crypto-secondary" />
                <span>Market Making</span>
              </Button>
              
              <Button 
                className="h-20 glass border border-crypto-accent/30 hover:border-crypto-accent/50 text-white flex flex-col items-center justify-center space-y-2"
                onClick={() => window.location.href = '/portfolio'}
              >
                <Wallet className="w-6 h-6 text-crypto-accent" />
                <span>Portfolio</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
