
import React from 'react';
import { UserProfile } from './UserProfile';
import { NotificationBell } from './NotificationBell';

export function AppHeader() {
  return (
    <header className="flex items-center justify-end w-full gap-2">
      <NotificationBell />
      <UserProfile />
    </header>
  );
}
