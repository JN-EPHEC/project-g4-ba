const admin = require('firebase-admin');

// Initialize with default credentials (from gcloud auth application-default login)
admin.initializeApp({
  projectId: 'wecamp-51f57'
});

const db = admin.firestore();

async function deleteAllBadges() {
  try {
    const badgesRef = db.collection('badges');
    const snapshot = await badgesRef.get();

    console.log('Found ' + snapshot.size + ' badges to delete');

    if (snapshot.size === 0) {
      console.log('No badges to delete');
      process.exit(0);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(function(docSnap) {
      console.log('Deleting: ' + docSnap.id + ' - ' + docSnap.data().name);
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    console.log('All badges deleted!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

deleteAllBadges();
