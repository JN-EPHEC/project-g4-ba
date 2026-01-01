import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Configuration Hugging Face
const HUGGINGFACE_TOKEN = functions.config().huggingface?.token || process.env.HUGGINGFACE_TOKEN;
// Utiliser le nouveau endpoint router de Hugging Face
const MODEL_ID = 'black-forest-labs/FLUX.1-schnell';
const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

// Dictionnaire de traduction français → anglais pour les animaux
const ANIMAL_TRANSLATIONS: Record<string, string> = {
  // Mammifères terrestres
  'loup': 'wolf',
  'renard': 'fox',
  'ours': 'bear',
  'cerf': 'deer',
  'sanglier': 'wild boar',
  'blaireau': 'badger',
  'loutre': 'otter',
  'castor': 'beaver',
  'écureuil': 'squirrel',
  'hérisson': 'hedgehog',
  'lapin': 'rabbit',
  'lièvre': 'hare',
  'lynx': 'lynx',
  'chamois': 'chamois',
  'bouquetin': 'ibex',
  'marmotte': 'marmot',
  'belette': 'weasel',
  'hermine': 'ermine',
  'fouine': 'stone marten',
  'martre': 'pine marten',
  // Oiseaux
  'aigle': 'eagle',
  'faucon': 'falcon',
  'hibou': 'owl',
  'chouette': 'owl',
  'corbeau': 'raven',
  'pie': 'magpie',
  'geai': 'jay',
  'pic': 'woodpecker',
  'merle': 'blackbird',
  'mésange': 'tit',
  'rouge-gorge': 'robin',
  'hirondelle': 'swallow',
  'martin-pêcheur': 'kingfisher',
  'héron': 'heron',
  'cigogne': 'stork',
  'grue': 'crane',
  'canard': 'duck',
  'oie': 'goose',
  'cygne': 'swan',
  'colombe': 'dove',
  'pigeon': 'pigeon',
  'tourterelle': 'turtle dove',
  'perdrix': 'partridge',
  'faisan': 'pheasant',
  'coq': 'rooster',
  'poule': 'hen',
  'paon': 'peacock',
  'autour': 'goshawk',
  'buse': 'buzzard',
  'épervier': 'sparrowhawk',
  'vautour': 'vulture',
  'condor': 'condor',
  'albatros': 'albatross',
  'mouette': 'seagull',
  'goéland': 'gull',
  'pélican': 'pelican',
  'flamant': 'flamingo',
  'perroquet': 'parrot',
  'ara': 'macaw',
  'toucan': 'toucan',
  'colibri': 'hummingbird',
  'rossignol': 'nightingale',
  'alouette': 'lark',
  'pinson': 'finch',
  'chardonneret': 'goldfinch',
  'moineau': 'sparrow',
  'étourneau': 'starling',
  'coucou': 'cuckoo',
  'huppe': 'hoopoe',
  'macareux': 'puffin',
  'pingouin': 'penguin',
  'manchot': 'penguin',
  'kiwi': 'kiwi bird',
  'émeu': 'emu',
  'autruche': 'ostrich',
  'casoar': 'cassowary',
  // Animaux marins
  'dauphin': 'dolphin',
  'baleine': 'whale',
  'orque': 'orca',
  'phoque': 'seal',
  'otarie': 'sea lion',
  'morse': 'walrus',
  'requin': 'shark',
  'raie': 'ray',
  'hippocampe': 'seahorse',
  'pieuvre': 'octopus',
  'poulpe': 'octopus',
  'méduse': 'jellyfish',
  'tortue marine': 'sea turtle',
  'espadon': 'swordfish',
  'thon': 'tuna',
  'saumon': 'salmon',
  'truite': 'trout',
  'brochet': 'pike',
  'carpe': 'carp',
  'anguille': 'eel',
  'crabe': 'crab',
  'homard': 'lobster',
  'crevette': 'shrimp',
  'étoile de mer': 'starfish',
  'oursin': 'sea urchin',
  'corail': 'coral',
  // Reptiles et amphibiens
  'serpent': 'snake',
  'couleuvre': 'grass snake',
  'vipère': 'viper',
  'cobra': 'cobra',
  'python': 'python',
  'boa': 'boa',
  'lézard': 'lizard',
  'gecko': 'gecko',
  'iguane': 'iguana',
  'caméléon': 'chameleon',
  'dragon de komodo': 'komodo dragon',
  'crocodile': 'crocodile',
  'alligator': 'alligator',
  'tortue': 'turtle',
  'grenouille': 'frog',
  'crapaud': 'toad',
  'salamandre': 'salamander',
  'triton': 'newt',
  // Insectes
  'abeille': 'bee',
  'papillon': 'butterfly',
  'libellule': 'dragonfly',
  'fourmi': 'ant',
  'coccinelle': 'ladybug',
  'scarabée': 'beetle',
  'luciole': 'firefly',
  'cigale': 'cicada',
  'grillon': 'cricket',
  'sauterelle': 'grasshopper',
  'mante religieuse': 'praying mantis',
  'araignée': 'spider',
  'scorpion': 'scorpion',
  // Animaux exotiques
  'lion': 'lion',
  'tigre': 'tiger',
  'léopard': 'leopard',
  'panthère': 'panther',
  'guépard': 'cheetah',
  'jaguar': 'jaguar',
  'puma': 'puma',
  'cougar': 'cougar',
  'éléphant': 'elephant',
  'rhinocéros': 'rhinoceros',
  'hippopotame': 'hippopotamus',
  'girafe': 'giraffe',
  'zèbre': 'zebra',
  'gorille': 'gorilla',
  'chimpanzé': 'chimpanzee',
  'orang-outan': 'orangutan',
  'singe': 'monkey',
  'babouin': 'baboon',
  'mandrill': 'mandrill',
  'lémurien': 'lemur',
  'koala': 'koala',
  'kangourou': 'kangaroo',
  'wallaby': 'wallaby',
  'wombat': 'wombat',
  'ornithorynque': 'platypus',
  'panda': 'panda',
  'panda roux': 'red panda',
  'raton laveur': 'raccoon',
  'mouffette': 'skunk',
  'tatou': 'armadillo',
  'paresseux': 'sloth',
  'fourmilier': 'anteater',
  'tapir': 'tapir',
  'okapi': 'okapi',
  'hyène': 'hyena',
  'chacal': 'jackal',
  'coyote': 'coyote',
  'dingo': 'dingo',
  'lama': 'llama',
  'alpaga': 'alpaca',
  'chameau': 'camel',
  'dromadaire': 'dromedary',
  'yak': 'yak',
  'bison': 'bison',
  'buffle': 'buffalo',
  'gnou': 'wildebeest',
  'antilope': 'antelope',
  'gazelle': 'gazelle',
  'impala': 'impala',
  'phacochère': 'warthog',
  'suricate': 'meerkat',
  'mangouste': 'mongoose',
  'fennec': 'fennec fox',
  'oryctérope': 'aardvark',
  // Animaux mythiques/légendaires (pour le fun)
  'phoenix': 'phoenix',
  'dragon': 'dragon',
  'licorne': 'unicorn',
  'griffon': 'griffin',
};

/**
 * Cloud Function pour générer une image de totem via Hugging Face
 * Contourne les restrictions CORS du navigateur
 * Note: Cette fonction permet les appels non authentifiés pour l'inscription
 */
export const generateTotemImage = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (data, context) => {
    // Authentification optionnelle - permet la génération pendant l'inscription
    const userId = context.auth?.uid || 'anonymous';

    const { animalName } = data;

    if (!animalName) {
      throw new functions.https.HttpsError('invalid-argument', 'Le nom de l\'animal est requis');
    }

    if (!HUGGINGFACE_TOKEN) {
      console.error('Token Hugging Face non configuré');
      throw new functions.https.HttpsError('failed-precondition', 'Service IA non configuré');
    }

    // Traduire le nom de l'animal en anglais pour le prompt
    const animalNameLower = animalName.toLowerCase().trim();
    const englishAnimalName = ANIMAL_TRANSLATIONS[animalNameLower] || animalNameLower;

    console.log(`Traduction: "${animalName}" → "${englishAnimalName}"`);

    // Construire le prompt avec l'animal traduit en anglais
    const prompt = `A circular scout badge emblem featuring a majestic ${englishAnimalName} animal in the center, the ${englishAnimalName} is the main subject, scout camping style, forest green and golden brown colors, nature elements like oak leaves and pine trees in the background, vintage badge design with rope border, high quality digital illustration, clean vector art style, white background, centered composition`;

    // Seed aléatoire pour avoir des images différentes à chaque génération
    const randomSeed = Math.floor(Math.random() * 2147483647);

    try {
      console.log(`Génération d'image pour: ${animalName} (seed: ${randomSeed})`);
      console.log(`Prompt: ${prompt}`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            seed: randomSeed,
            num_inference_steps: 4,
            guidance_scale: 0,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.estimated_time) {
            throw new functions.https.HttpsError(
              'unavailable',
              `Le modèle est en cours de chargement. Réessayez dans ${Math.ceil(errorData.estimated_time)} secondes.`
            );
          }
        }
        throw new functions.https.HttpsError('internal', `Erreur Hugging Face: ${response.status}`);
      }

      // Récupérer l'image en buffer
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      // Uploader vers Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `totems/${userId}/${Date.now()}.png`;
      const file = bucket.file(fileName);

      await file.save(Buffer.from(imageBuffer), {
        metadata: {
          contentType: 'image/png',
        },
      });

      // Rendre le fichier public et obtenir l'URL
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      console.log(`Image générée avec succès: ${publicUrl}`);

      return {
        success: true,
        imageUrl: publicUrl,
        imageBase64: `data:image/png;base64,${base64Image}`,
      };

    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError('internal', error.message || 'Erreur lors de la génération');
    }
  });

/**
 * DÉSACTIVÉ : Cette fonction créait automatiquement un document user
 * mais elle écrasait les données envoyées par le client (notamment le rôle).
 * La création du document est maintenant gérée côté client dans UserService.createUser()
 *
 * Si vous avez besoin de réactiver cette fonction, utilisez setDoc avec { merge: true }
 * ou vérifiez d'abord si le document existe.
 */
export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  try {
    // Vérifier si le document existe déjà (créé par le client)
    const existingDoc = await admin.firestore().collection('users').doc(uid).get();

    if (existingDoc.exists) {
      console.log(`ℹ️ Document user existe déjà pour ${email} (UID: ${uid}), skip de la création automatique`);
      return;
    }

    // Le document n'existe pas encore - cela ne devrait pas arriver si le client fonctionne correctement
    // On ne crée PAS de document par défaut pour éviter d'écraser les données du client
    console.warn(`⚠️ Document user non trouvé pour ${email} (UID: ${uid}) - le client devrait le créer`);

    // NE PAS créer de document ici - laisser le client le faire avec les bonnes données

  } catch (error) {
    console.error('❌ Erreur dans createUserDocument:', error);
  }
});

/**
 * Met à jour le document user quand l'utilisateur est supprimé
 */
export const deleteUserDocument = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    await admin.firestore().collection('users').doc(uid).delete();
    console.log(`✅ Document user supprimé pour ${uid}`);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du document user:', error);
  }
});

/**
 * Cloud Function pour créer les canaux manquants basés sur les messages existants
 * Récupère les channelId uniques de channelMessages et crée les documents channels correspondants
 */
export const createMissingChannels = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
    }

    // Vérifier que l'utilisateur est un animateur
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'animator') {
      throw new functions.https.HttpsError('permission-denied', 'Seuls les animateurs peuvent effectuer cette action');
    }

    const { unitId } = data;
    if (!unitId) {
      throw new functions.https.HttpsError('invalid-argument', 'unitId est requis');
    }

    try {
      // Récupérer tous les channelId uniques des messages
      const messagesSnapshot = await admin.firestore().collection('channelMessages').get();
      const channelIds = new Set<string>();

      messagesSnapshot.docs.forEach(doc => {
        const channelId = doc.data().channelId;
        if (channelId) {
          channelIds.add(channelId);
        }
      });

      console.log(`Trouvé ${channelIds.size} channelId(s) uniques`);

      // Vérifier quels canaux existent déjà
      const existingChannels = await admin.firestore().collection('channels').get();
      const existingIds = new Set(existingChannels.docs.map(d => d.id));

      let createdCount = 0;
      const now = admin.firestore.Timestamp.now();

      // Créer les canaux manquants
      for (const channelId of channelIds) {
        if (!existingIds.has(channelId)) {
          // Créer un canal "Général" pour ce channelId
          await admin.firestore().collection('channels').doc(channelId).set({
            id: channelId,
            name: 'Général',
            description: 'Discussions générales',
            type: 'general',
            unitId: unitId,
            icon: '💬',
            permissions: {
              canRead: ['scout', 'animator'],
              canWrite: ['scout', 'animator'],
            },
            isDefault: true,
            createdBy: context.auth.uid,
            createdAt: now,
            updatedAt: now,
          });
          createdCount++;
          console.log(`Canal créé: ${channelId}`);
        }
      }

      // Créer aussi les canaux par défaut s'ils n'existent pas
      const defaultChannels = [
        {
          name: 'Annonces',
          description: 'Annonces importantes de l\'unité',
          type: 'announcements',
          icon: '📢',
          permissions: { canRead: ['scout', 'animator'], canWrite: ['animator'] },
        },
        {
          name: 'Annonces Parents',
          description: 'Annonces et informations pour les parents',
          type: 'parents',
          icon: '👨‍👩‍👧',
          permissions: { canRead: ['parent', 'animator'], canWrite: ['animator'] },
        },
      ];

      for (const defaultChannel of defaultChannels) {
        // Vérifier si un canal de ce type existe déjà
        const existingOfType = await admin.firestore()
          .collection('channels')
          .where('unitId', '==', unitId)
          .where('type', '==', defaultChannel.type)
          .get();

        if (existingOfType.empty) {
          const newChannelRef = admin.firestore().collection('channels').doc();
          await newChannelRef.set({
            id: newChannelRef.id,
            ...defaultChannel,
            unitId: unitId,
            isDefault: true,
            createdBy: context.auth.uid,
            createdAt: now,
            updatedAt: now,
          });
          createdCount++;
          console.log(`Canal par défaut créé: ${defaultChannel.name}`);
        }
      }

      console.log(`✅ ${createdCount} canal(aux) créé(s)`);
      return { success: true, createdCount, channelIdsFound: Array.from(channelIds) };

    } catch (error: any) {
      console.error('Erreur lors de la création des canaux:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Erreur lors de la création');
    }
  });

/**
 * Cloud Function pour synchroniser les permissions des canaux
 * avec les permissions par défaut (accessible aux animateurs uniquement)
 */
export const syncChannelPermissions = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
    }

    // Vérifier que l'utilisateur est un animateur
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'animator') {
      throw new functions.https.HttpsError('permission-denied', 'Seuls les animateurs peuvent effectuer cette action');
    }

    // Permissions par défaut
    const DEFAULT_CHANNEL_PERMISSIONS: Record<string, { canRead: string[]; canWrite: string[] }> = {
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

    try {
      const channelsSnapshot = await admin.firestore().collection('channels').get();
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
            await docSnap.ref.update({
              permissions: defaultPerms,
              updatedAt: admin.firestore.Timestamp.now(),
            });
            updatedCount++;
            console.log(`Canal "${channel.name}" mis à jour`);
          }
        }
      }

      console.log(`✅ ${updatedCount} canal(aux) mis à jour`);
      return { success: true, updatedCount };

    } catch (error: any) {
      console.error('Erreur lors de la synchronisation:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Erreur lors de la synchronisation');
    }
  });
