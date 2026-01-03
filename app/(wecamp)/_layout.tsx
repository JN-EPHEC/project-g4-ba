import { Stack } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

export default function WeCampAdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Vérification du rôle admin
  if (user.role !== UserRole.WECAMP_ADMIN && user.role !== 'wecamp_admin') {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="create-challenge" />
    </Stack>
  );
}
