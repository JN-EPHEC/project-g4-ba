/**
 * Script admin pour synchroniser les permissions des canaux
 * Utilise Firebase Admin SDK avec les credentials par défaut
 *
 * Exécuter avec: node scripts/sync-channel-permissions-admin.js
 */

const admin = require('firebase-admin');

// Initialiser avec les credentials par défaut (utilise GOOGLE_APPLICATION_CREDENTIALS ou gcloud auth)
admin.initializeApp({
  projectId: 'wecamp-642bc',
});

const db = admin.firestore();

// Nouvelles permissions par défaut
const DEFAULT_CHANNEL_PERMISSIONS = {
  announcements: {
    canRead: ['scout', 'animator'],
    canWrite: ['animator'],
  },
  general: {
    canRead: ['scout', 'animator'],
    canWrite: ['scout', 'animator'],
  },
  parents: {
    canRead: ['parent', 'animator'],
    canWrite: ['animator'],
  },
  custom: {
    canRead: ['scout', 'animator'],
    canWrite: ['animator'],
  },
};

async function syncChannelPermissions() {
  console.log('Récupération des canaux...');
  const channelsSnapshot = await db.collection('channels').get();

  console.log(`${channelsSnapshot.size} canaux trouvés.`);

  let updatedCount = 0;

  for (const docSnap of channelsSnapshot.docs) {
    const channel = docSnap.data();
    const channelType = channel.type;
    const defaultPerms = DEFAULT_CHANNEL_PERMISSIONS[channelType];

    if (defaultPerms) {
      const currentCanRead = JSON.stringify([...(channel.permissions?.canRead || [])].sort());
      const defaultCanRead = JSON.stringify([...defaultPerms.canRead].sort());
      const currentCanWrite = JSON.stringify([...(channel.permissions?.canWrite || [])].sort());
      const defaultCanWrite = JSON.stringify([...defaultPerms.canWrite].sort());

      if (currentCanRead !== defaultCanRead || currentCanWrite !== defaultCanWrite) {
        console.log(`\nMise à jour du canal "${channel.name}" (${channelType}):`);
        console.log(`  canRead: ${currentCanRead} -> ${defaultCanRead}`);
        console.log(`  canWrite: ${currentCanWrite} -> ${defaultCanWrite}`);

        await docSnap.ref.update({
          permissions: defaultPerms,
          updatedAt: admin.firestore.Timestamp.now(),
        });

        updatedCount++;
      } else {
        console.log(`Canal "${channel.name}" déjà à jour.`);
      }
    }
  }

  console.log(`\n✅ Terminé! ${updatedCount} canal(aux) mis à jour.`);
  process.exit(0);
}

syncChannelPermissions().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});
