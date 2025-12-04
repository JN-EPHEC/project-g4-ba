/**
 * Script pour nettoyer les utilisateurs invalides dans Firestore
 *
 * Supprime les utilisateurs qui :
 * - N'ont pas de unitId (pour les animateurs et scouts)
 * - N'ont pas les champs requis
 *
 * Usage: npx ts-node scripts/cleanup-users.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAbhp-2lyOggt13Vkz5d5h567TQ85pu29w",
  authDomain: "wecamp-642bc.firebaseapp.com",
  projectId: "wecamp-642bc",
  storageBucket: "wecamp-642bc.firebasestorage.app",
  messagingSenderId: "260742902094",
  appId: "1:260742902094:web:6cdadf6dece0c04742ae1f"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface UserDoc {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  unitId?: string;
  parentIds?: string[];
  scoutIds?: string[];
}

async function cleanupUsers() {
  console.log('🔍 Analyse des utilisateurs...\n');

  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  const usersToDelete: UserDoc[] = [];
  const validUsers: UserDoc[] = [];

  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const user: UserDoc = {
      id: docSnapshot.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      unitId: data.unitId,
      parentIds: data.parentIds,
      scoutIds: data.scoutIds,
    };

    let isValid = true;
    const issues: string[] = [];

    // Vérifier les champs de base
    if (!user.email) {
      issues.push('pas d\'email');
      isValid = false;
    }
    if (!user.firstName) {
      issues.push('pas de prénom');
      isValid = false;
    }
    if (!user.role) {
      issues.push('pas de rôle');
      isValid = false;
    }

    // Vérifier unitId pour animateurs et scouts
    if (user.role === 'animator' && !user.unitId) {
      issues.push('animateur sans unitId');
      isValid = false;
    }
    if (user.role === 'scout' && !user.unitId) {
      issues.push('scout sans unitId');
      isValid = false;
    }

    if (!isValid) {
      usersToDelete.push(user);
      console.log(`❌ ${user.email || user.id} - ${issues.join(', ')}`);
    } else {
      validUsers.push(user);
      console.log(`✅ ${user.email} (${user.role}) - unitId: ${user.unitId || 'N/A'}`);
    }
  });

  console.log('\n📊 Résumé:');
  console.log(`   - Utilisateurs valides: ${validUsers.length}`);
  console.log(`   - Utilisateurs à supprimer: ${usersToDelete.length}`);

  if (usersToDelete.length === 0) {
    console.log('\n✨ Aucun utilisateur à supprimer!');
    return;
  }

  console.log('\n🗑️  Utilisateurs qui seront supprimés:');
  usersToDelete.forEach((user) => {
    console.log(`   - ${user.id} (${user.email || 'sans email'})`);
  });

  // Demander confirmation
  console.log('\n⚠️  Pour supprimer ces utilisateurs, exécutez avec --confirm');

  if (process.argv.includes('--confirm')) {
    console.log('\n🗑️  Suppression en cours...');

    for (const user of usersToDelete) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        console.log(`   ✓ Supprimé: ${user.id}`);
      } catch (error) {
        console.error(`   ✗ Erreur pour ${user.id}:`, error);
      }
    }

    console.log('\n✅ Nettoyage terminé!');
  }
}

cleanupUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  });
