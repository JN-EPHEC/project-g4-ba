import React from 'react';
import { EventsScreen } from '@/components/events-screen';
import { UserRole } from '@/types';

export default function AnimatorEventsScreen() {
  return (
    <EventsScreen
      userRole={UserRole.ANIMATOR}
      canCreate={true}
      canDelete={true}
      canEdit={true}
    />
  );
}
