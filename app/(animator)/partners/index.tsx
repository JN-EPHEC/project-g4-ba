import { Redirect } from 'expo-router';

// Cette page redirige vers la page des défis
// Les récompenses sont maintenant accessibles via l'onglet dans la page défis
export default function PartnersRedirect() {
  return <Redirect href="/(animator)/challenges" />;
}
