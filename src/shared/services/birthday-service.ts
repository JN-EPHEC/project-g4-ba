import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getDaysUntilBirthday, getAge } from '@/src/shared/utils/date-utils';

export interface BirthdayInfo {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  dateOfBirth: Date;
  daysUntil: number;
  age: number;
  isToday: boolean;
}

export class BirthdayService {
  /**
   * Récupérer les anniversaires à venir pour une unité
   * Inclut les scouts ET les animateurs de l'unité
   */
  static async getUpcomingBirthdays(unitId: string, days = 30): Promise<BirthdayInfo[]> {
    try {
      const birthdays: BirthdayInfo[] = [];

      // Récupérer les scouts de l'unité
      const scoutsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'scout'),
        where('unitId', '==', unitId)
      );

      // Récupérer les animateurs de l'unité
      const animatorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'animator'),
        where('unitId', '==', unitId)
      );

      const [scoutsSnapshot, animatorsSnapshot] = await Promise.all([
        getDocs(scoutsQuery),
        getDocs(animatorsQuery),
      ]);

      // Fonction pour traiter les documents
      const processUser = (doc: any) => {
        const data = doc.data();
        if (data.dateOfBirth) {
          const dateOfBirth = data.dateOfBirth?.toDate
            ? data.dateOfBirth.toDate()
            : new Date(data.dateOfBirth);

          const daysUntil = getDaysUntilBirthday(dateOfBirth);

          // Inclure seulement si l'anniversaire est dans les X prochains jours
          if (daysUntil <= days) {
            birthdays.push({
              id: doc.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              avatarUrl: data.profilePicture || data.avatarUrl,
              dateOfBirth,
              daysUntil,
              age: getAge(dateOfBirth) + (daysUntil === 0 ? 0 : 1), // Age au prochain anniversaire
              isToday: daysUntil === 0,
            });
          }
        }
      };

      // Traiter les scouts et les animateurs
      scoutsSnapshot.docs.forEach(processUser);
      animatorsSnapshot.docs.forEach(processUser);

      // Trier par jours restants
      birthdays.sort((a, b) => a.daysUntil - b.daysUntil);

      return birthdays;
    } catch (error) {
      console.error('[BirthdayService] Erreur:', error);
      return [];
    }
  }

  /**
   * Récupérer les anniversaires du jour
   */
  static async getTodaysBirthdays(unitId: string): Promise<BirthdayInfo[]> {
    const birthdays = await this.getUpcomingBirthdays(unitId, 0);
    return birthdays.filter((b) => b.isToday);
  }

  /**
   * Formater le label pour un anniversaire
   */
  static getBirthdayLabel(daysUntil: number): string {
    if (daysUntil === 0) {
      return "Aujourd'hui ! 🎂";
    } else if (daysUntil === 1) {
      return 'Demain';
    } else if (daysUntil <= 7) {
      return `Dans ${daysUntil} jours`;
    } else {
      const weeks = Math.floor(daysUntil / 7);
      return weeks === 1 ? 'Dans 1 semaine' : `Dans ${weeks} semaines`;
    }
  }
}
