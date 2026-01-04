const admin = require('firebase-admin');

// Initialize with default credentials (from gcloud auth application-default login)
admin.initializeApp({
  projectId: 'wecamp-642bc'
});

const db = admin.firestore();

async function deleteAllChallenges() {
  try {
    const challengesRef = db.collection('challenges');
    const snapshot = await challengesRef.get();

    console.log('Found ' + snapshot.size + ' challenges to delete');

    if (snapshot.size === 0) {
      console.log('No challenges to delete');
      process.exit(0);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(function(docSnap) {
      console.log('Deleting: ' + docSnap.id + ' - ' + docSnap.data().title);
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    console.log('All challenges deleted!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

deleteAllChallenges();
