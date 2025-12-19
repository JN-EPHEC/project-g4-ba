import { Redirect } from 'expo-router';

// Redirection vers la page welcome pour les nouveaux utilisateurs
// ou vers auth pour la connexion
export default function LoginRedirect() {
  return <Redirect href="/(auth)/welcome" />;
}
