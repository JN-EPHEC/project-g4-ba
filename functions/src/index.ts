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
 */
export const generateTotemImage = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
    }

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
      const fileName = `totems/${context.auth.uid}/${Date.now()}.png`;
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
