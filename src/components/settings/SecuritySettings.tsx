
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export const SecuritySettings = () => {
  const [twoFactorEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="h-6 w-6 text-crypto-primary" />
        <h2 className="text-xl font-semibold text-white">Security</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white">Two-Factor Authentication</span>
          <Button size="sm" variant="outline" className={`border-green-500/30 text-green-400 ${twoFactorEnabled ? 'bg-green-500/10' : ''}`}>
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">API Access</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-white/20 text-white">
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/90 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">API Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">API Key</label>
                  <div className="flex mt-1">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value="ck_test_abcd1234..."
                      readOnly
                      className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-white"
                    />
                    <Button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      variant="outline" 
                      className="border-white/10 rounded-l-none"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Use this API key to integrate with external trading bots</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Button className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30" variant="outline">
          Change Password
        </Button>
      </div>
    </div>
  );
};
