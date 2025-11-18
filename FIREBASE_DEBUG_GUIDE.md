# Guide de débogage Firebase

Ce guide vous aide à identifier et résoudre les problèmes de connexion Firebase dans WeCamp.

## 🧪 Page de test Firebase

Nous avons créé une page de test dédiée pour diagnostiquer les problèmes Firebase.

### Comment y accéder:

1. Démarrez votre application: `npm run web`
2. Dans votre navigateur, accédez à: `http://localhost:8081/firebase-test`

### Tests disponibles:

#### 1. Test de connexion
- Vérifie que Firebase Auth, Firestore et Storage sont initialisés
- Teste l'écriture et la lecture dans Firestore
- Identifie les problèmes de configuration

#### 2. Test d'authentification
- Crée un compte test
- Se connecte et se déconnecte
- Supprime le compte test
- Vérifie que l'authentification fonctionne de bout en bout

## 📊 Logs détaillés

Nous avons ajouté des logs détaillés dans toute l'application pour suivre le flux d'authentification:

### Comment voir les logs:

1. **Dans le navigateur:**
   - Appuyez sur `F12` pour ouvrir les outils de développement
   - Allez dans l'onglet `Console`
   - Les logs sont préfixés avec des émojis:
     - 🔵 = Informations
     - ✅ = Succès
     - ❌ = Erreur
     - ⚠️ = Avertissement
     - 🧪 = Tests

2. **Exemple de logs lors de l'inscription:**
   ```
   🔵 [FIREBASE CONFIG] Initialisation de Firebase...
   ✅ [FIREBASE CONFIG] Firebase initialisé avec succès
   🔵 [ROLE SELECTION] Appel de la fonction register...
   🔵 [AUTH] Début de l'inscription pour: test@example.com
   🔵 [AUTH] Création du compte Firebase Auth...
   ✅ [AUTH] Compte Firebase Auth créé avec UID: abc123...
   🔵 [USER SERVICE] Création d'un nouvel utilisateur
   🔵 [USER SERVICE] Tentative d'écriture dans Firestore...
   ✅ [USER SERVICE] Utilisateur créé avec succès dans Firestore!
   ✅ [AUTH] Inscription terminée avec succès!
   ```

## 🔍 Diagnostic des problèmes courants

### Problème 1: "Aucun utilisateur pour ce projet" dans Firebase Console

**Cause possible:** Firebase Authentication Email/Password n'est pas activé

**Solution:**
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `wecamp-642bc`
3. Cliquez sur `Authentication` dans le menu de gauche
4. Allez dans l'onglet `Sign-in method`
5. Activez `Email/Password`
6. Cliquez sur `Save`

### Problème 2: Les utilisateurs n'apparaissent pas dans Firestore

**Cause possible:** La base de données Firestore n'a pas été créée

**Solution:**
1. Dans la console Firebase, cliquez sur `Firestore Database`
2. Cliquez sur `Create database`
3. Choisissez `Start in test mode`
4. Sélectionnez un emplacement (ex: `europe-west1`)
5. Cliquez sur `Enable`

### Problème 3: Erreur "Permission denied" dans Firestore

**Cause possible:** Les règles de sécurité Firestore bloquent l'écriture

**Solution:**
1. Dans Firestore Database, allez dans l'onglet `Rules`
2. Remplacez par les règles du fichier `FIREBASE_SETUP.md`
3. Cliquez sur `Publish`

### Problème 4: L'application se bloque après l'inscription

**Cause possible:** Erreur lors de la récupération des données utilisateur

**Diagnostic:**
1. Ouvrez la console (F12)
2. Cherchez les logs avec ❌
3. Vérifiez le message d'erreur complet
4. Vérifiez que le document utilisateur existe dans Firestore

## 🛠️ Checklist de vérification

Avant de créer un nouveau compte, vérifiez:

- [ ] Firebase Authentication Email/Password est activé
- [ ] Firestore Database est créé
- [ ] Les règles de sécurité Firestore sont configurées
- [ ] La console du navigateur est ouverte (F12)
- [ ] Vous avez accès à la console Firebase pour vérifier les données

## 📝 Rapport d'erreur

Si vous rencontrez toujours des problèmes après avoir suivi ce guide:

1. Ouvrez la console du navigateur (F12)
2. Allez sur `/firebase-test`
3. Lancez le "Test de connexion"
4. Copiez le résultat du test
5. Copiez tous les logs de la console
6. Partagez ces informations pour obtenir de l'aide

## 🔄 Réinitialisation complète

Si rien ne fonctionne, essayez une réinitialisation complète:

1. **Nettoyer le cache du navigateur:**
   - `Ctrl+Shift+Delete` (Chrome/Edge)
   - Cochez "Cache" et "Cookies"
   - Cliquez sur "Effacer les données"

2. **Arrêter et redémarrer le serveur:**
   ```bash
   # Arrêter le serveur (Ctrl+C)
   # Nettoyer le cache
   npm run clean  # ou rm -rf .expo node_modules/.cache
   # Redémarrer
   npm run web
   ```

3. **Vérifier la configuration Firebase:**
   - Vérifiez que `config/firebase.ts` contient vos vrais credentials
   - Vérifiez que le `projectId` correspond à votre projet

4. **Créer un nouveau compte de test:**
   - Utilisez un nouvel email
   - Suivez le processus d'inscription
   - Vérifiez les logs dans la console

## 📞 Support

Si vous avez besoin d'aide supplémentaire:

1. Vérifiez les logs dans la console (F12)
2. Lancez les tests sur `/firebase-test`
3. Consultez la documentation Firebase:
   - [Firebase Authentication](https://firebase.google.com/docs/auth)
   - [Cloud Firestore](https://firebase.google.com/docs/firestore)
