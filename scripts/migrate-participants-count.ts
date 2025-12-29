/**
 * Script de migration pour mettre à jour le participantsCount des défis
 * basé sur les soumissions validées (status = 'completed')
 *
 * Usage: npx ts-node scripts/migrate-participants-count.ts
 *
 * Configuration:
 *   Option 1: Service Account
 *     - Téléchargez votre service account depuis Firebase Console
 *     - Définissez: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *
 *   Option 2: Firebase CLI Token
 *     - Connectez-vous avec: firebase login
 *     - Le script utilisera automatiquement le token
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require('firebase-admin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// Chercher un fichier de service account
function findServiceAccount(): string | null {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccount.json'),
    path.join(__dirname, '../serviceAccount.json'),
    path.join(__dirname, 'firebase-service-account.json'),
    path.join(__dirname, '../firebase-service-account.json'),
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = findServiceAccount();

  if (serviceAccountPath) {
    console.log(`📁 Utilisation du service account: ${serviceAccountPath}`);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  } else {
    console.log('🔑 Tentative d\'utilisation des Application Default Credentials...');
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'wecamp-8f00b',
      });
    } catch (error) {
      console.error('❌ Impossible d\'initialiser Firebase Admin.');
      console.error('   Veuillez définir GOOGLE_APPLICATION_CREDENTIALS ou vous connecter avec firebase login');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

async function migrateParticipantsCount() {
  console.log('\n🚀 Début de la migration des compteurs de participants...\n');

  try {
    // 1. Récupérer toutes les soumissions validées
    const submissionsSnapshot = await db
      .collection('challengeSubmissions')
      .where('status', '==', 'completed')
      .get();

    console.log(`📊 ${submissionsSnapshot.size} soumissions validées trouvées\n`);

    if (submissionsSnapshot.empty) {
      console.log('Aucune soumission validée à migrer.');
      return;
    }

    // 2. Compter les soumissions par défi
    const challengeCounts: Record<string, number> = {};

    submissionsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      const challengeId = data.challengeId;

      if (challengeId) {
        challengeCounts[challengeId] = (challengeCounts[challengeId] || 0) + 1;
      }
    });

    console.log('📈 Compteurs par défi:');
    for (const [challengeId, count] of Object.entries(challengeCounts)) {
      console.log(`   - ${challengeId}: ${count} validation(s)`);
    }
    console.log('');

    // 3. Mettre à jour chaque défi
    const batch = db.batch();
    let updateCount = 0;

    for (const [challengeId, count] of Object.entries(challengeCounts)) {
      const challengeRef = db.collection('challenges').doc(challengeId);
      const challengeDoc = await challengeRef.get();

      if (challengeDoc.exists) {
        const currentCount = challengeDoc.data()?.participantsCount || 0;

        if (currentCount !== count) {
          batch.update(challengeRef, { participantsCount: count });
          console.log(`✏️  Mise à jour défi "${challengeDoc.data()?.title || challengeId}": ${currentCount} → ${count}`);
          updateCount++;
        } else {
          console.log(`✅ Défi "${challengeDoc.data()?.title || challengeId}" déjà à jour (${count})`);
        }
      } else {
        console.log(`⚠️  Défi ${challengeId} non trouvé (peut-être supprimé)`);
      }
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Migration terminée: ${updateCount} défi(s) mis à jour`);
    } else {
      console.log('\n✅ Tous les défis sont déjà à jour');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
migrateParticipantsCount()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
