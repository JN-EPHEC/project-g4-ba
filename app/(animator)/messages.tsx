import React from 'react';

import { MessagesScreen } from '@/components/messages-screen';
import { useAuth } from '@/context/auth-context';
import type { Animator } from '@/types';
import { UserRole } from '@/types';

export default function AnimatorMessagesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;

  if (!animator) return null;

  return (
    <MessagesScreen
      user={animator}
      unitId={animator.unitId}
      userRole={UserRole.ANIMATOR}
    />
  );
}
