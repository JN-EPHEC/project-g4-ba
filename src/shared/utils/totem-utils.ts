import { TOTEM_ANIMALS } from '@/components/totem-selector';

/**
 * Interface pour un utilisateur avec potentiellement un totem
 */
interface UserWithTotem {
  firstName?: string;
  lastName?: string;
  totemAnimal?: string;
  totemName?: string;
  totemEmoji?: string; // Emoji personnalisé (priorité sur totemAnimal)
}

/**
 * Récupère l'emoji d'un animal totem par son nom
 */
export function getTotemEmoji(animalName?: string): string | null {
  if (!animalName) return null;
  const animal = TOTEM_ANIMALS.find(a => a.name === animalName);
  return animal?.emoji || null;
}

/**
 * Récupère l'emoji du totem d'un utilisateur
 * Priorité: totemEmoji personnalisé > emoji de l'animal totem
 */
export function getUserTotemEmoji(user: UserWithTotem | null | undefined): string {
  if (!user) return '';

  // Priorité à l'emoji personnalisé
  if (user.totemEmoji) {
    return user.totemEmoji;
  }

  // Sinon, utiliser l'emoji de l'animal
  if (user.totemAnimal) {
    return getTotemEmoji(user.totemAnimal) || '';
  }

  return '';
}

/**
 * Formate le nom complet d'un utilisateur avec l'emoji de son totem
 * @param user - L'utilisateur avec firstName, lastName et optionnellement totemAnimal/totemEmoji
 * @param options - Options de formatage
 * @returns Le nom formaté avec ou sans emoji
 */
export function getDisplayName(
  user: UserWithTotem | null | undefined,
  options: {
    showTotem?: boolean;
    firstNameOnly?: boolean;
  } = {}
): string {
  const { showTotem = true, firstNameOnly = false } = options;

  if (!user) return '';

  const name = firstNameOnly
    ? user.firstName || ''
    : `${user.firstName || ''} ${user.lastName || ''}`.trim();

  if (!name) return '';

  if (showTotem) {
    const emoji = getUserTotemEmoji(user);
    if (emoji) {
      return `${emoji} ${name}`;
    }
  }

  return name;
}
