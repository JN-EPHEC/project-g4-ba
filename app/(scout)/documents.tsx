import { useAuth } from '@/context/auth-context';
import { DriveScreen } from '@/components/drive-screen';
import { UserRole } from '@/types';

export default function ScoutDocumentsScreen() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SCOUT) {
    return null;
  }

  return (
    <DriveScreen
      user={user}
      unitId={user.unitId || ''}
      userRole={UserRole.SCOUT}
    />
  );
}
