import { DeleteAccountScreen } from '@/components/delete-account-screen';
import { UserRole } from '@/types';

export default function ScoutDeleteAccountScreen() {
  return <DeleteAccountScreen userRole={UserRole.SCOUT} />;
}
