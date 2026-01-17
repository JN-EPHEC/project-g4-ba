/**
 * Types pour les sections d'une unité scoute
 * Une section représente un groupe d'âge au sein d'une unité (ex: Louveteaux, Pionniers)
 */

/**
 * Types de sections disponibles
 */
export enum SectionType {
  BALADINS = 'baladins',       // 5-7 ans
  LOUVETEAUX = 'louveteaux',   // 8-11 ans
  LUTINS = 'lutins',           // 8-11 ans (guides)
  ECLAIREURS = 'eclaireurs',   // 12-16 ans
  GUIDES = 'guides',           // 12-16 ans
  PIONNIERS = 'pionniers',     // 16-18 ans
  ROUTIERS = 'routiers',       // 18+ ans
}

/**
 * Interface représentant une section
 */
export interface Section {
  id: string;
  unitId: string;              // Référence vers l'unité parente
  name: string;                // Ex: "Louveteaux de Thuin"
  sectionType: SectionType;
  accessCode: string;          // Format: PREFIXE-XXXXXX (ex: LOUV-A1B2C3)
  leaderId?: string;           // Chef de section (premier animateur à rejoindre)
  description?: string;
  logoUrl?: string;            // Logo de la section (généré par IA ou uploadé)
  ageRange: {
    min: number;
    max: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Préfixes des codes d'accès par type de section
 */
export const SECTION_PREFIXES: Record<SectionType, string> = {
  [SectionType.BALADINS]: 'BAL',
  [SectionType.LOUVETEAUX]: 'LOUV',
  [SectionType.LUTINS]: 'LUT',
  [SectionType.ECLAIREURS]: 'ECL',
  [SectionType.GUIDES]: 'GUI',
  [SectionType.PIONNIERS]: 'PIO',
  [SectionType.ROUTIERS]: 'ROU',
};

/**
 * Tranches d'âge par type de section
 */
export const SECTION_AGE_RANGES: Record<SectionType, { min: number; max: number }> = {
  [SectionType.BALADINS]: { min: 5, max: 7 },
  [SectionType.LOUVETEAUX]: { min: 8, max: 11 },
  [SectionType.LUTINS]: { min: 8, max: 11 },
  [SectionType.ECLAIREURS]: { min: 12, max: 16 },
  [SectionType.GUIDES]: { min: 12, max: 16 },
  [SectionType.PIONNIERS]: { min: 16, max: 18 },
  [SectionType.ROUTIERS]: { min: 18, max: 99 },
};

/**
 * Labels d'affichage pour les types de section
 */
export const SECTION_LABELS: Record<SectionType, string> = {
  [SectionType.BALADINS]: 'Baladins',
  [SectionType.LOUVETEAUX]: 'Louveteaux',
  [SectionType.LUTINS]: 'Lutins',
  [SectionType.ECLAIREURS]: 'Éclaireurs',
  [SectionType.GUIDES]: 'Guides',
  [SectionType.PIONNIERS]: 'Pionniers',
  [SectionType.ROUTIERS]: 'Routiers',
};

/**
 * Couleurs associées à chaque type de section
 */
export const SECTION_COLORS: Record<SectionType, string> = {
  [SectionType.BALADINS]: '#FFB347',    // Orange clair
  [SectionType.LOUVETEAUX]: '#4A90D9',  // Bleu
  [SectionType.LUTINS]: '#9B59B6',      // Violet
  [SectionType.ECLAIREURS]: '#2ECC71',  // Vert
  [SectionType.GUIDES]: '#E91E63',      // Rose
  [SectionType.PIONNIERS]: '#E74C3C',   // Rouge
  [SectionType.ROUTIERS]: '#34495E',    // Gris foncé
};

/**
 * Emojis associés à chaque type de section
 */
export const SECTION_EMOJIS: Record<SectionType, string> = {
  [SectionType.BALADINS]: '🌈',
  [SectionType.LOUVETEAUX]: '🐺',
  [SectionType.LUTINS]: '🧚',
  [SectionType.ECLAIREURS]: '🏕️',
  [SectionType.GUIDES]: '🌸',
  [SectionType.PIONNIERS]: '🔥',
  [SectionType.ROUTIERS]: '🎒',
};

/**
 * Récupère le type de section à partir d'un préfixe de code
 */
export function getSectionTypeFromPrefix(prefix: string): SectionType | null {
  const upperPrefix = prefix.toUpperCase();
  for (const [type, p] of Object.entries(SECTION_PREFIXES)) {
    if (p === upperPrefix) {
      return type as SectionType;
    }
  }
  return null;
}

/**
 * Valide le format d'un code d'accès de section
 * Format attendu: PREFIXE-XXXXXX (ex: LOUV-A1B2C3)
 */
export function isValidSectionCode(code: string): boolean {
  const pattern = /^(BAL|LOUV|LUT|ECL|GUI|PIO|ROU)-[A-Z0-9]{6}$/;
  return pattern.test(code.toUpperCase());
}

/**
 * Valide le format d'un code d'accès d'unité
 * Format attendu: UNIT-XXXXXX (ex: UNIT-A1B2C3)
 */
export function isValidUnitCode(code: string): boolean {
  const pattern = /^UNIT-[A-Z0-9]{6}$/;
  return pattern.test(code.toUpperCase());
}

/**
 * Vérifie si un code est un code d'unité ou de section valide
 */
export function isValidAccessCode(code: string): { valid: boolean; type: 'unit' | 'section' | null } {
  if (isValidUnitCode(code)) {
    return { valid: true, type: 'unit' };
  }
  if (isValidSectionCode(code)) {
    return { valid: true, type: 'section' };
  }
  return { valid: false, type: null };
}

/**
 * Extrait le préfixe d'un code d'accès
 */
export function extractPrefixFromCode(code: string): string | null {
  const match = code.toUpperCase().match(/^(BAL|LOUV|LUT|ECL|GUI|PIO|ROU|UNIT)-/);
  return match ? match[1] : null;
}
