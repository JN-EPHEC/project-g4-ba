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
import { db } from '@/config/firebase';
import { AnyUser, UserRole, Scout, Parent, Animator } from '@/types';

/**
 * Service pour gérer les utilisateurs dans Firestore
 */
export class UserService {
  private static readonly COLLECTION_NAME = 'users';

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
        } as Animator;

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
      const now = new Date();
      const baseUserData = {
        email,
        firstName,
        lastName,
        role,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        ...additionalData,
      };

      // Ajouter les champs spécifiques selon le rôle
      let userData: any = baseUserData;

      switch (role) {
        case UserRole.SCOUT:
          userData = {
            ...baseUserData,
            parentIds: additionalData?.parentIds || [],
            unitId: additionalData?.unitId || '',
            points: additionalData?.points || 0,
            dateOfBirth: additionalData?.dateOfBirth 
              ? (additionalData.dateOfBirth instanceof Date 
                  ? Timestamp.fromDate(additionalData.dateOfBirth) 
                  : additionalData.dateOfBirth)
              : Timestamp.fromDate(new Date()),
          };
          break;

        case UserRole.PARENT:
          userData = {
            ...baseUserData,
            scoutIds: additionalData?.scoutIds || [],
          };
          break;

        case UserRole.ANIMATOR:
          userData = {
            ...baseUserData,
            unitId: additionalData?.unitId || '',
            isUnitLeader: additionalData?.isUnitLeader || false,
          };
          break;
      }

      await setDoc(doc(db, this.COLLECTION_NAME, userId), userData);

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
      // Convertir updatedAt en Timestamp si c'est une Date
      const firestoreUpdates: any = { ...updates };
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
}

