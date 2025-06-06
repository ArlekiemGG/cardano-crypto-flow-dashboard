
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/settings";

interface AccountSettingsProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSave: () => void;
  isLoading: boolean;
}

export const AccountSettings = ({ userProfile, setUserProfile, onSave, isLoading }: AccountSettingsProps) => {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <User className="h-6 w-6 text-crypto-primary" />
        <h2 className="text-xl font-semibold text-white">Account</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm">Email</label>
          <input 
            type="email" 
            value={userProfile.email}
            onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none" 
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm">Username</label>
          <input 
            type="text" 
            value={userProfile.username}
            onChange={(e) => setUserProfile(prev => ({ ...prev, username: e.target.value }))}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-crypto-primary focus:outline-none" 
            placeholder="Your username"
          />
        </div>
        <Button 
          onClick={onSave}
          disabled={isLoading}
          className="w-full bg-crypto-primary hover:bg-crypto-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
