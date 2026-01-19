import { DeleteAccountScreen } from '@/components/delete-account-screen';
import { UserRole } from '@/types';

export default function AnimatorDeleteAccountScreen() {
  return <DeleteAccountScreen userRole={UserRole.ANIMATOR} />;
}
