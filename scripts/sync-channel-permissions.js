/**
 * Script pour synchroniser les permissions des canaux existants
 * avec les permissions par défaut définies dans channel.ts
 *
 * Exécuter avec: node scripts/sync-channel-permissions.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, query, Timestamp } = require('firebase/firestore');

// Configuration Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyD2S3lsORWvM-SYvqsYncjp2A-0qO-5H3g',
  authDomain: 'wecamp-642bc.firebaseapp.com',
  projectId: 'wecamp-642bc',
  storageBucket: 'wecamp-642bc.firebasestorage.app',
  messagingSenderId: '779754921651',
  appId: '1:779754921651:web:4e3b8ad107253d24d2e97f',
};

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
  console.log('Initialisation Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Récupération des canaux...');
  const channelsRef = collection(db, 'channels');
  const snapshot = await getDocs(query(channelsRef));

  console.log(`${snapshot.size} canaux trouvés.`);

  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
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

        await updateDoc(docSnap.ref, {
          permissions: defaultPerms,
          updatedAt: Timestamp.fromDate(new Date()),
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
