import { DeleteAccountScreen } from '@/components/delete-account-screen';
import { UserRole } from '@/types';

export default function ParentDeleteAccountScreen() {
  return <DeleteAccountScreen userRole={UserRole.PARENT} />;
}
