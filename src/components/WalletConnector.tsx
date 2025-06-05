
import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Loader2, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const walletInfo = {
  nami: {
    name: 'Nami',
    icon: '🟦',
    downloadUrl: 'https://namiwallet.io/',
  },
  eternl: {
    name: 'Eternl',
    icon: '🔷',
    downloadUrl: 'https://eternl.io/',
  },
  flint: {
    name: 'Flint',
    icon: '🔥',
    downloadUrl: 'https://flint-wallet.com/',
  },
  vespr: {
    name: 'Vespr',
    icon: '🦋',
    downloadUrl: 'https://vespr.xyz/',
  },
  yoroi: {
    name: 'Yoroi',
    icon: '⚡',
    downloadUrl: 'https://yoroi-wallet.com/',
  },
  gerowallet: {
    name: 'Gero',
    icon: '🚀',
    downloadUrl: 'https://gerowallet.io/',
  },
  nufi: {
    name: 'NuFi',
    icon: '💎',
    downloadUrl: 'https://nu.fi/',
  },
};

export const WalletConnector: React.FC = () => {
  const { connectWallet, isConnecting, error, getAvailableWallets } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const availableWallets = getAvailableWallets();

  const handleWalletConnect = async (walletName: string) => {
    try {
      await connectWallet(walletName);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
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
          <DialogTitle className="text-white">Connect Cardano Wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose your preferred Cardano wallet to connect to the application
          </DialogDescription>
        </DialogHeader>

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
            availableWallets.map((walletName) => {
              const wallet = walletInfo[walletName as keyof typeof walletInfo];
              return (
                <Button
                  key={walletName}
                  onClick={() => handleWalletConnect(walletName)}
                  disabled={isConnecting}
                  className="w-full h-16 glass border border-white/10 hover:border-crypto-primary/50 hover:bg-crypto-primary/10 text-white justify-start"
                  variant="ghost"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet?.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{wallet?.name}</div>
                      <div className="text-xs text-gray-400">
                        {isConnecting ? (
                          <div className="flex items-center">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Connecting...
                          </div>
                        ) : (
                          'Available'
                        )}
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 ml-auto text-green-400" />
                </Button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No Cardano wallets detected</p>
              <p className="text-sm text-gray-500 mb-6">
                Install a Cardano wallet extension to continue
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(walletInfo).map(([key, wallet]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="text-xs border-white/20 hover:border-crypto-primary/50"
                    onClick={() => window.open(wallet.downloadUrl, '_blank')}
                  >
                    {wallet.icon} {wallet.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          Make sure to refresh the page after installing a wallet extension
        </div>
      </DialogContent>
    </Dialog>
  );
};
