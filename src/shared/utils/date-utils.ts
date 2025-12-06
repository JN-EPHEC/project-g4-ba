/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Retourne un label de countdown pour une date
 * Ex: "Aujourd'hui", "Demain", "J-3", "Dans 2 semaines"
 */
export function getCountdownLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Passé';
  } else if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return 'Demain';
  } else if (diffDays === 2) {
    return 'Après-demain';
  } else if (diffDays <= 7) {
    return `J-${diffDays}`;
  } else if (diffDays <= 14) {
    return 'Dans 1 semaine';
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Dans ${weeks} semaines`;
  } else {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? 'Dans 1 mois' : `Dans ${months} mois`;
  }
}

/**
 * Retourne la couleur associée au countdown
 */
export function getCountdownColor(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return '#666666'; // Gris pour passé
  } else if (diffDays === 0) {
    return '#ef4444'; // Rouge pour aujourd'hui
  } else if (diffDays <= 2) {
    return '#f97316'; // Orange pour demain/après-demain
  } else if (diffDays <= 7) {
    return '#eab308'; // Jaune pour cette semaine
  } else {
    return '#22c55e'; // Vert pour plus tard
  }
}

/**
 * Vérifie si un élément est nouveau (créé il y a moins de 24h)
 */
export function isNew(createdAt: Date): boolean {
  const now = new Date();
  const diffTime = now.getTime() - createdAt.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  return diffHours < 24;
}

/**
 * Retourne un timestamp relatif
 * Ex: "il y a 2h", "il y a 3 jours", "à l'instant"
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return "À l'instant";
  } else if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? 'Il y a 1 semaine' : `Il y a ${diffWeeks} semaines`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? 'Il y a 1 mois' : `Il y a ${diffMonths} mois`;
  } else {
    const years = Math.floor(diffMonths / 12);
    return years === 1 ? 'Il y a 1 an' : `Il y a ${years} ans`;
  }
}

/**
 * Formate une date en format court
 * Ex: "25 déc", "3 jan"
 */
export function formatShortDate(date: Date): string {
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Formate une heure
 * Ex: "14h30", "9h00"
 */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

/**
 * Vérifie si deux dates sont le même jour
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calcule les jours restants jusqu'à un anniversaire
 */
export function getDaysUntilBirthday(birthDate: Date): number {
  const now = new Date();
  const thisYear = now.getFullYear();

  // Anniversaire cette année
  let nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());

  // Si l'anniversaire est déjà passé cette année, prendre l'année prochaine
  if (nextBirthday < now) {
    nextBirthday = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diffTime = nextBirthday.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcule l'âge à partir de la date de naissance
 */
export function getAge(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
