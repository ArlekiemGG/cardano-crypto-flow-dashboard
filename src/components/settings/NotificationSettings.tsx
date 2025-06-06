
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { NotificationSettings as NotificationSettingsType } from "@/types/settings";

interface NotificationSettingsProps {
  notifications: NotificationSettingsType;
  onToggle: (key: keyof NotificationSettingsType) => void;
}

export const NotificationSettings = ({ notifications, onToggle }: NotificationSettingsProps) => {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="h-6 w-6 text-crypto-primary" />
        <h2 className="text-xl font-semibold text-white">Notifications</h2>
      </div>
      
      <div className="space-y-4">
        {Object.entries(notifications).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-white capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={() => onToggle(key as keyof NotificationSettingsType)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
