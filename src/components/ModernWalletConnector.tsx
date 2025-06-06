
import React, { useState } from 'react';
import { useWallet } from '@/contexts/ModernWalletContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Loader2, Wallet, Shield, Download, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const walletInfo = {
  eternl: {
    name: 'Eternl',
    icon: '♾️',
    downloadUrl: 'https://eternl.io/',
    description: 'Feature-rich Cardano wallet',
  },
  nami: {
    name: 'Nami',
    icon: '🟦',
    downloadUrl: 'https://namiwallet.io/',
    description: 'Light wallet for Cardano',
  },
  yoroi: {
    name: 'Yoroi',
    icon: '⚡',
    downloadUrl: 'https://yoroi-wallet.com/',
    description: 'Emurgo official wallet',
  },
  flint: {
    name: 'Flint',
    icon: '🔥',
    downloadUrl: 'https://flint-wallet.com/',
    description: 'Simple and secure',
  },
  typhoncip30: {
    name: 'Typhon',
    icon: '🌀',
    downloadUrl: 'https://typhonwallet.io/',
    description: 'Advanced DeFi features',
  },
  gerowallet: {
    name: 'Gero',
    icon: '🚀',
    downloadUrl: 'https://gerowallet.io/',
    description: 'Multi-platform wallet',
  },
  brave: {
    name: 'Brave Wallet',
    icon: '🦁',
    downloadUrl: 'https://brave.com/wallet/',
    description: 'Built-in browser wallet',
  },
};

export const ModernWalletConnector: React.FC = () => {
  const { connectWallet, isConnecting, error, getAvailableWallets, hasWallet } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const availableWallets = getAvailableWallets();

  const handleWalletConnect = async (walletName: string) => {
    try {
      setConnectingWallet(walletName);
      await connectWallet(walletName);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleDownloadWallet = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button 
          className="glass border border-crypto-primary/30 text-crypto-primary hover:bg-crypto-primary/10"
          size="sm"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-crypto-primary" />
            Connect Cardano Wallet (2025)
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your Cardano wallet using the latest protocols and security features.
          </DialogDescription>
        </DialogHeader>

        {/* Security Notice */}
        <Alert className="border-crypto-primary/50 bg-crypto-primary/10">
          <Shield className="h-4 w-4 text-crypto-primary" />
          <AlertDescription className="text-crypto-primary text-sm">
            Using Lucid Evolution & Blockfrost for secure blockchain connection.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {availableWallets.length > 0 ? (
            <>
              <h4 className="text-sm font-medium text-white mb-2">Available Wallets ({availableWallets.length}):</h4>
              {availableWallets.map((walletName) => {
                const wallet = walletInfo[walletName as keyof typeof walletInfo];
                const isCurrentlyConnecting = connectingWallet === walletName;
                
                return (
                  <Button
                    key={walletName}
                    onClick={() => handleWalletConnect(walletName)}
                    disabled={isConnecting}
                    className="w-full h-16 glass border border-white/10 hover:border-crypto-primary/50 hover:bg-crypto-primary/10 text-white justify-start"
                    variant="ghost"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <span className="text-2xl">{wallet?.icon}</span>
                      <div className="text-left flex-1">
                        <div className="font-medium">{wallet?.name}</div>
                        <div className="text-xs text-gray-400">
                          {isCurrentlyConnecting ? (
                            <div className="flex items-center text-crypto-primary">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Connecting via Lucid Evolution...
                            </div>
                          ) : (
                            wallet?.description
                          )}
                        </div>
                      </div>
                      {isCurrentlyConnecting ? (
                        <Loader2 className="w-5 h-5 text-crypto-primary animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400 opacity-50" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No Cardano wallets detected</p>
              <p className="text-sm text-gray-500 mb-6">
                Install a supported 2025 wallet extension to continue
              </p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white mb-3">Recommended 2025 Wallets:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(walletInfo).slice(0, 4).map(([key, wallet]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="text-xs border-white/20 hover:border-crypto-primary/50 justify-between"
                      onClick={() => handleDownloadWallet(wallet.downloadUrl)}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">{wallet.icon}</span>
                        {wallet.name}
                      </span>
                      <Download className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center mt-4 space-y-1">
          <p>🔒 Secure authentication with Lucid Evolution</p>
          <p>🔄 Auto-reconnection and 30s balance updates</p>
          <p>Refresh page after installing new wallets</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
