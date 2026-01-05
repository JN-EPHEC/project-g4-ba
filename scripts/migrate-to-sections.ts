/**
 * Script de migration pour créer des sections par défaut pour chaque unité existante
 *
 * Ce script:
 * 1. Récupère toutes les unités existantes
 * 2. Pour chaque unité sans sections, crée une section "Principale" de type LOUVETEAUX
 * 3. Assigne tous les membres (scouts et animateurs) de l'unité à cette section
 * 4. Met à jour les champs sectionId et isSectionLeader
 *
 * Usage: npx ts-node scripts/migrate-to-sections.ts
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';

// Types
enum SectionType {
  BALADINS = 'baladins',
  LOUVETEAUX = 'louveteaux',
  LUTINS = 'lutins',
  ECLAIREURS = 'eclaireurs',
  GUIDES = 'guides',
  PIONNIERS = 'pionniers',
  ROUTIERS = 'routiers',
}

const SECTION_PREFIXES: Record<SectionType, string> = {
  [SectionType.BALADINS]: 'BAL',
  [SectionType.LOUVETEAUX]: 'LOUV',
  [SectionType.LUTINS]: 'LUT',
  [SectionType.ECLAIREURS]: 'ECL',
  [SectionType.GUIDES]: 'GUI',
  [SectionType.PIONNIERS]: 'PIO',
  [SectionType.ROUTIERS]: 'ROU',
};

const SECTION_AGE_RANGES: Record<SectionType, { min: number; max: number }> = {
  [SectionType.BALADINS]: { min: 5, max: 7 },
  [SectionType.LOUVETEAUX]: { min: 8, max: 11 },
  [SectionType.LUTINS]: { min: 8, max: 11 },
  [SectionType.ECLAIREURS]: { min: 12, max: 16 },
  [SectionType.GUIDES]: { min: 12, max: 16 },
  [SectionType.PIONNIERS]: { min: 16, max: 18 },
  [SectionType.ROUTIERS]: { min: 18, max: 99 },
};

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
let serviceAccount: ServiceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Erreur: service-account-key.json non trouvé');
  console.log('📝 Instructions:');
  console.log('1. Allez sur https://console.firebase.google.com/project/wecamp-642bc/settings/serviceaccounts/adminsdk');
  console.log('2. Cliquez sur "Générer une nouvelle clé privée"');
  console.log('3. Sauvegardez le fichier JSON comme "service-account-key.json" à la racine du projet');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

/**
 * Génère un code d'accès unique pour une section
 */
function generateAccessCode(sectionType: SectionType): string {
  const prefix = SECTION_PREFIXES[sectionType];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Vérifie si une unité a déjà des sections
 */
async function unitHasSections(unitId: string): Promise<boolean> {
  const sectionsSnapshot = await db
    .collection('sections')
    .where('unitId', '==', unitId)
    .limit(1)
    .get();
  return !sectionsSnapshot.empty;
}

/**
 * Crée une section par défaut pour une unité
 */
async function createDefaultSection(
  unitId: string,
  unitName: string
): Promise<string> {
  const sectionType = SectionType.LOUVETEAUX; // Type par défaut
  const accessCode = generateAccessCode(sectionType);
  const now = Timestamp.now();

  const sectionData = {
    unitId,
    name: `Section principale - ${unitName}`,
    sectionType,
    accessCode,
    leaderId: '',
    description: 'Section créée automatiquement lors de la migration',
    ageRange: SECTION_AGE_RANGES[sectionType],
    createdAt: now,
    updatedAt: now,
  };

  const sectionRef = await db.collection('sections').add(sectionData);
  console.log(`  ✅ Section créée: ${sectionData.name} (Code: ${accessCode})`);
  return sectionRef.id;
}

/**
 * Met à jour les membres d'une unité avec la nouvelle sectionId
 */
async function updateUnitMembers(
  unitId: string,
  sectionId: string
): Promise<{ scouts: number; animators: number; leaderId: string | null }> {
  const usersSnapshot = await db
    .collection('users')
    .where('unitId', '==', unitId)
    .get();

  let scouts = 0;
  let animators = 0;
  let leaderId: string | null = null;

  const batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const updates: Record<string, any> = {
      sectionId,
      updatedAt: Timestamp.now(),
    };

    if (userData.role === 'scout') {
      scouts++;
    } else if (userData.role === 'animator') {
      animators++;
      // Le premier animateur trouvé devient chef de section
      if (!leaderId) {
        leaderId = userDoc.id;
        updates.isSectionLeader = true;
      } else {
        updates.isSectionLeader = false;
      }
    }

    batch.update(userDoc.ref, updates);
  }

  await batch.commit();
  return { scouts, animators, leaderId };
}

/**
 * Met à jour la section avec le leaderId
 */
async function updateSectionLeader(
  sectionId: string,
  leaderId: string
): Promise<void> {
  await db.collection('sections').doc(sectionId).update({
    leaderId,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Fonction principale de migration
 */
async function migrate() {
  console.log('🚀 Démarrage de la migration vers les sections...\n');

  // 1. Récupérer toutes les unités
  const unitsSnapshot = await db.collection('units').get();
  console.log(`📊 ${unitsSnapshot.size} unités trouvées\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const unitDoc of unitsSnapshot.docs) {
    const unitData = unitDoc.data();
    const unitId = unitDoc.id;
    const unitName = unitData.name || 'Unité sans nom';

    console.log(`\n📍 Traitement: ${unitName} (${unitId})`);

    try {
      // Vérifier si l'unité a déjà des sections
      const hasSections = await unitHasSections(unitId);
      if (hasSections) {
        console.log('  ⏭️ Sections existantes, ignoré');
        skippedCount++;
        continue;
      }

      // Créer une section par défaut
      const sectionId = await createDefaultSection(unitId, unitName);

      // Mettre à jour les membres
      const { scouts, animators, leaderId } = await updateUnitMembers(
        unitId,
        sectionId
      );

      // Mettre à jour le leader de section
      if (leaderId) {
        await updateSectionLeader(sectionId, leaderId);
        console.log(`  👤 Chef de section défini: ${leaderId}`);
      }

      console.log(`  📊 ${scouts} scouts et ${animators} animateurs assignés`);
      migratedCount++;
    } catch (error) {
      console.error(`  ❌ Erreur:`, error);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('📊 RÉSUMÉ DE LA MIGRATION');
  console.log('========================================');
  console.log(`✅ Unités migrées: ${migratedCount}`);
  console.log(`⏭️ Unités ignorées (déjà migrées): ${skippedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log('========================================\n');

  if (errorCount === 0) {
    console.log('🎉 Migration terminée avec succès !');
  } else {
    console.log('⚠️ Migration terminée avec des erreurs. Vérifiez les logs ci-dessus.');
  }
}

// Exécuter la migration
migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
