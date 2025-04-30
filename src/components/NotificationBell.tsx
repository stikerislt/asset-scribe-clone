
import { useState, useEffect } from "react";
import { BellIcon } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  notification_type: string;
  related_asset_id: string | null;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentTenant?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !currentTenant?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id && !!currentTenant?.id,
    staleTime: 1000 * 60, // 1 minute
  });
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  const handleMarkAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'checkout':
        return '📤';
      case 'checkin':
        return '📥';
      case 'low_inventory':
        return '⚠️';
      case 'overdue':
        return '⏰';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 border-b last:border-0 flex hover:bg-muted/50 transition-colors cursor-pointer ${notification.is_read ? 'opacity-70' : 'bg-muted/30'}`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <span className="mr-2 text-xl">
                    {getNotificationIcon(notification.notification_type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <span className="text-muted-foreground text-xs">
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.related_asset_id && (
                      <div className="mt-1">
                        <Link 
                          to={`/assets/${notification.related_asset_id}`}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View asset
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
