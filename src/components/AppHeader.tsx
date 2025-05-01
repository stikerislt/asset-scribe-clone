
import React from 'react';
import { UserProfile } from './UserProfile';

export function AppHeader() {
  return (
    <header className="flex items-center justify-end w-full">
      <UserProfile />
    </header>
  );
}
