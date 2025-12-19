import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="unit-selection" />
      <Stack.Screen name="animator-unit-selection" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="pending-approval" />
    </Stack>
  );
}
