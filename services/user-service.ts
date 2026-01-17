import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { AnyUser, UserRole, Scout, Parent, Animator, WeCampAdmin } from '@/types';

/**
 * Service pour gérer les utilisateurs dans Firestore
 */
export class UserService {
  private static readonly COLLECTION_NAME = 'users';

  /**
   * Génère un code de liaison unique pour les scouts
   * Format: ABC-123-XYZ (3 lettres - 3 chiffres - 3 lettres)
   */
  static generateLinkCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I et O pour éviter confusion
    const digits = '0123456789';

    const randomLetters = (count: number) =>
      Array.from({ length: count }, () => letters[Math.floor(Math.random() * letters.length)]).join('');

    const randomDigits = (count: number) =>
      Array.from({ length: count }, () => digits[Math.floor(Math.random() * digits.length)]).join('');

    return `${randomLetters(3)}-${randomDigits(3)}-${randomLetters(3)}`;
  }

  /**
   * Convertit un objet Firestore en utilisateur avec les dates converties
   */
  static convertFirestoreUser(data: DocumentData): AnyUser {
    const baseUser = {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role as UserRole,
      profilePicture: data.profilePicture,
      bio: data.bio,
      phone: data.phone,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };

    switch (data.role) {
      case UserRole.SCOUT:
        return {
          ...baseUser,
          role: UserRole.SCOUT,
          parentIds: data.parentIds || [],
          unitId: data.unitId || '',
          points: data.points || 0,
          rank: data.rank,
          dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
          totemName: data.totemName,
          totemAnimal: data.totemAnimal,
          totemEmoji: data.totemEmoji,
          validated: data.validated || false,
          validatedAt: data.validatedAt?.toDate(),
          validatedBy: data.validatedBy,
          lastNewsViewedAt: data.lastNewsViewedAt?.toDate(),
          linkCode: data.linkCode,
          linkCodeGeneratedAt: data.linkCodeGeneratedAt?.toDate(),
        } as Scout;

      case UserRole.PARENT:
        return {
          ...baseUser,
          role: UserRole.PARENT,
          scoutIds: data.scoutIds || [],
          phone: data.phone,
        } as Parent;

      case UserRole.ANIMATOR:
        return {
          ...baseUser,
          role: UserRole.ANIMATOR,
          unitId: data.unitId || '',
          isUnitLeader: data.isUnitLeader || false,
          specialties: data.specialties || [],
          totemName: data.totemName,
          totemAnimal: data.totemAnimal,
        } as Animator;

      case UserRole.WECAMP_ADMIN:
      case 'wecamp_admin':
        return {
          ...baseUser,
          role: UserRole.WECAMP_ADMIN,
        } as WeCampAdmin;

      default:
        throw new Error(`Rôle invalide: ${data.role}`);
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  static async getUserById(userId: string): Promise<AnyUser | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));

      if (!userDoc.exists()) {
        return null;
      }

      return this.convertFirestoreUser({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son email
   */
  static async getUserByEmail(email: string): Promise<AnyUser | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.convertFirestoreUser({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur par email:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur dans Firestore
   */
  static async createUser(
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    additionalData?: Partial<AnyUser>
  ): Promise<AnyUser> {
    try {
      // Rafraîchir le token Firebase Auth pour les règles Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
        } catch {
          // Ignorer silencieusement
        }
      }

      const now = new Date();

      // Supprimer le champ 'role' de additionalData s'il existe pour éviter l'écrasement
      const safeAdditionalData = additionalData ? { ...additionalData } : {};
      if ('role' in safeAdditionalData) {
        delete (safeAdditionalData as any).role;
      }

      const baseUserData = {
        email,
        firstName,
        lastName,
        ...safeAdditionalData,
        role, // role APRÈS le spread pour garantir qu'il n'est pas écrasé
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Ajouter les champs spécifiques selon le rôle
      let userData: any = baseUserData;

      switch (role) {
        case UserRole.SCOUT:
          userData = {
            ...baseUserData,
            parentIds: (additionalData as any)?.parentIds || [],
            unitId: (additionalData as any)?.unitId || '',
            points: (additionalData as any)?.points || 0,
            validated: false,
            dateOfBirth: (additionalData as any)?.dateOfBirth
              ? ((additionalData as any).dateOfBirth instanceof Date
                  ? Timestamp.fromDate((additionalData as any).dateOfBirth)
                  : (additionalData as any).dateOfBirth)
              : Timestamp.fromDate(new Date()),
            linkCode: this.generateLinkCode(),
            linkCodeGeneratedAt: Timestamp.fromDate(now),
          };
          break;

        case UserRole.PARENT:
          userData = {
            ...baseUserData,
            scoutIds: (additionalData as any)?.scoutIds || [],
          };
          break;

        case UserRole.ANIMATOR:
          userData = {
            ...baseUserData,
            unitId: (additionalData as any)?.unitId || '',
            isUnitLeader: (additionalData as any)?.isUnitLeader || false,
          };
          break;
      }

      const docRef = doc(db, this.COLLECTION_NAME, userId);
      await setDoc(docRef, userData);

      return this.convertFirestoreUser({ id: userId, ...userData });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur dans Firestore
   */
  static async updateUser(userId: string, updates: Partial<AnyUser>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);

      // Filtrer les valeurs undefined (Firestore ne les accepte pas)
      const firestoreUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          firestoreUpdates[key] = value;
        }
      }

      // Convertir updatedAt en Timestamp si c'est une Date
      if (firestoreUpdates.updatedAt instanceof Date) {
        firestoreUpdates.updatedAt = Timestamp.fromDate(firestoreUpdates.updatedAt);
      } else {
        firestoreUpdates.updatedAt = Timestamp.fromDate(new Date());
      }

      await updateDoc(userRef, firestoreUpdates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Régénère le code de liaison d'un scout
   * Utile si le code a été compromis
   */
  static async regenerateLinkCode(scoutId: string): Promise<string> {
    const newCode = this.generateLinkCode();
    const userRef = doc(db, this.COLLECTION_NAME, scoutId);

    await updateDoc(userRef, {
      linkCode: newCode,
      linkCodeGeneratedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return newCode;
  }

  /**
   * Récupère un scout par son code de liaison
   */
  static async getScoutByLinkCode(linkCode: string): Promise<Scout | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('linkCode', '==', linkCode.toUpperCase()),
        where('role', '==', UserRole.SCOUT)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const docData = snapshot.docs[0];
      return this.convertFirestoreUser({ id: docData.id, ...docData.data() }) as Scout;
    } catch (error) {
      console.error('Erreur getScoutByLinkCode:', error);
      return null;
    }
  }

  /**
   * Génère des codes de liaison pour tous les scouts qui n'en ont pas
   * Utile pour la migration des scouts existants
   */
  static async generateMissingLinkCodes(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Récupérer tous les scouts sans code de liaison
      const scoutsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('role', '==', UserRole.SCOUT)
      );

      const snapshot = await getDocs(scoutsQuery);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Si le scout n'a pas de code, en générer un
        if (!data.linkCode) {
          try {
            const newCode = this.generateLinkCode();
            await updateDoc(doc(db, this.COLLECTION_NAME, docSnap.id), {
              linkCode: newCode,
              linkCodeGeneratedAt: Timestamp.fromDate(new Date()),
            });
            updated++;
            console.log(`Code généré pour ${data.firstName} ${data.lastName}: ${newCode}`);
          } catch (error) {
            console.error(`Erreur pour ${docSnap.id}:`, error);
            errors++;
          }
        }
      }

      console.log(`Migration terminée: ${updated} codes générés, ${errors} erreurs`);
      return { updated, errors };
    } catch (error) {
      console.error('Erreur generateMissingLinkCodes:', error);
      return { updated, errors };
    }
  }
}
