
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  onClose?: () => void;
}

export function NotificationsDropdown({ 
  notifications,
  onClose
}: NotificationsDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative text-gray-400 hover:text-white hover:bg-white/10"
        >
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-black/90 backdrop-blur-xl border border-white/10 text-white"
        align="end"
        sideOffset={10}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-3">
          <h3 className="font-medium text-white">Notificaciones</h3>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              No hay notificaciones
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className="p-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                >
                  <div className="text-sm font-medium">{notification.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{notification.description}</div>
                  <div className="text-xs text-crypto-primary mt-2">{notification.time}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
