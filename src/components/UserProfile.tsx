
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function UserProfile() {
  const { user, logout } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const userInitials = user.email 
    ? user.email.substring(0, 2).toUpperCase()
    : "?";

  const userDisplayName = user.user_metadata?.full_name || user.email || "User";

  return (
    <div className="flex items-center justify-between p-4 border-t">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-none">{userDisplayName}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
            {user.email}
          </p>
        </div>
      </div>
      <Button
        variant="ghost" 
        size="icon"
        onClick={() => logout()}
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
