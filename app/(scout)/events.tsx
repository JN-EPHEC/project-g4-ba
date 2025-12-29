import React from 'react';
import { EventsScreen } from '@/components/events-screen';
import { UserRole } from '@/types';

export default function ScoutEventsScreen() {
  return (
    <EventsScreen
      userRole={UserRole.SCOUT}
      canCreate={false}
      canDelete={false}
    />
  );
}
