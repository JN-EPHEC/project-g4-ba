import { db } from '@/config/firebase';
import {
  Section,
  SectionType,
  SECTION_PREFIXES,
  SECTION_AGE_RANGES,
  UserRole,
} from '@/types';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { UserService } from './user-service';

/**
 * Service pour gérer les sections d'une unité scoute
 * Une section représente un groupe d'âge (ex: Louveteaux, Pionniers)
 */
export class SectionService {
  private static readonly SECTIONS_COLLECTION = 'sections';

  /**
   * Convertit un document Firestore en Section
   */
  private static convertSection(data: DocumentData): Section {
    return {
      id: data.id,
      unitId: data.unitId,
      name: data.name,
      sectionType: data.sectionType as SectionType,
      accessCode: data.accessCode,
      leaderId: data.leaderId || undefined,
      description: data.description || undefined,
      ageRange: data.ageRange || SECTION_AGE_RANGES[data.sectionType as SectionType],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Génère un code d'accès unique pour une section
   * Format: PREFIXE-XXXXXX (ex: LOUV-A1B2C3)
   */
  static generateAccessCode(sectionType: SectionType): string {
    const prefix = SECTION_PREFIXES[sectionType];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = `${prefix}-`;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crée une nouvelle section dans une unité (Admin WeCamp uniquement)
   */
  static async createSection(
    unitId: string,
    name: string,
    sectionType: SectionType,
    description?: string
  ): Promise<Section> {
    try {
      const accessCode = this.generateAccessCode(sectionType);
      const ageRange = SECTION_AGE_RANGES[sectionType];
      const now = new Date();

      const sectionData: Record<string, any> = {
        unitId,
        name,
        sectionType,
        accessCode,
        leaderId: '', // Pas de leader initial
        ageRange,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      if (description) sectionData.description = description;

      const sectionRef = doc(collection(db, this.SECTIONS_COLLECTION));
      await setDoc(sectionRef, sectionData);

      return this.convertSection({ id: sectionRef.id, ...sectionData });
    } catch (error) {
      console.error('Erreur lors de la création de la section:', error);
      throw error;
    }
  }

  /**
   * Récupère une section par son ID
   */
  static async getSectionById(sectionId: string): Promise<Section | null> {
    try {
      const sectionDoc = await getDoc(doc(db, this.SECTIONS_COLLECTION, sectionId));

      if (!sectionDoc.exists()) {
        return null;
      }

      return this.convertSection({ id: sectionDoc.id, ...sectionDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de la section:', error);
      throw error;
    }
  }

  /**
   * Recherche une section par son code d'accès
   */
  static async getSectionByAccessCode(accessCode: string): Promise<Section | null> {
    try {
      const q = query(
        collection(db, this.SECTIONS_COLLECTION),
        where('accessCode', '==', accessCode.toUpperCase())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const sectionDoc = querySnapshot.docs[0];
      return this.convertSection({ id: sectionDoc.id, ...sectionDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la recherche par code d\'accès:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les sections d'une unité
   */
  static async getSectionsByUnit(unitId: string): Promise<Section[]> {
    try {
      const q = query(
        collection(db, this.SECTIONS_COLLECTION),
        where('unitId', '==', unitId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertSection({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des sections:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les sections
   */
  static async getAllSections(): Promise<Section[]> {
    try {
      const querySnapshot = await getDocs(
        collection(db, this.SECTIONS_COLLECTION)
      );
      return querySnapshot.docs.map((doc) =>
        this.convertSection({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les sections:', error);
      throw error;
    }
  }

  /**
   * Met à jour une section
   */
  static async updateSection(
    sectionId: string,
    updates: Partial<Omit<Section, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const sectionRef = doc(db, this.SECTIONS_COLLECTION, sectionId);
      await updateDoc(sectionRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la section:', error);
      throw error;
    }
  }

  /**
   * Supprime une section
   */
  static async deleteSection(sectionId: string): Promise<void> {
    try {
      // Vérifier qu'il n'y a plus de membres dans la section
      const members = await this.getSectionMembers(sectionId);
      if (members.length > 0) {
        throw new Error('Impossible de supprimer une section avec des membres. Réassignez-les d\'abord.');
      }

      await deleteDoc(doc(db, this.SECTIONS_COLLECTION, sectionId));
    } catch (error) {
      console.error('Erreur lors de la suppression de la section:', error);
      throw error;
    }
  }

  /**
   * Permet à un animateur de rejoindre une section via son code d'accès
   * Le premier animateur à rejoindre devient automatiquement chef de section
   */
  static async joinSectionAsAnimator(
    animatorId: string,
    accessCode: string
  ): Promise<{ section: Section; unitId: string; isLeader: boolean }> {
    try {
      // Trouver la section par code
      const section = await this.getSectionByAccessCode(accessCode);

      if (!section) {
        throw new Error('Code de section invalide');
      }

      // Vérifier si c'est le premier animateur (devient leader de section)
      const isFirstAnimator = !section.leaderId || section.leaderId === '';

      // Mettre à jour l'animateur avec sectionId, unitId et le statut de leader
      await UserService.updateUser(animatorId, {
        unitId: section.unitId,
        sectionId: section.id,
        isSectionLeader: isFirstAnimator,
      });

      // Si premier animateur, mettre à jour la section avec le leaderId
      if (isFirstAnimator) {
        await this.updateSection(section.id, { leaderId: animatorId });
      }

      return {
        section,
        unitId: section.unitId,
        isLeader: isFirstAnimator,
      };
    } catch (error) {
      console.error('Erreur lors de la jonction à la section:', error);
      throw error;
    }
  }

  /**
   * Permet à un scout de rejoindre une section via son code d'accès
   */
  static async joinSectionAsScout(
    scoutId: string,
    accessCode: string
  ): Promise<{ section: Section; unitId: string }> {
    try {
      // Trouver la section par code
      const section = await this.getSectionByAccessCode(accessCode);

      if (!section) {
        throw new Error('Code de section invalide');
      }

      // Mettre à jour le scout avec sectionId et unitId
      await UserService.updateUser(scoutId, {
        unitId: section.unitId,
        sectionId: section.id,
      });

      return {
        section,
        unitId: section.unitId,
      };
    } catch (error) {
      console.error('Erreur lors de la jonction à la section:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les membres d'une section (scouts + animateurs)
   */
  static async getSectionMembers(sectionId: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isSectionLeader?: boolean;
  }[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('sectionId', '==', sectionId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          role: data.role as UserRole,
          isSectionLeader: data.isSectionLeader || false,
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
      throw error;
    }
  }

  /**
   * Récupère les scouts d'une section
   */
  static async getScoutsBySection(sectionId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('sectionId', '==', sectionId),
        where('role', '==', UserRole.SCOUT)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des scouts:', error);
      throw error;
    }
  }

  /**
   * Récupère les animateurs d'une section
   */
  static async getAnimatorsBySection(sectionId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('sectionId', '==', sectionId),
        where('role', '==', UserRole.ANIMATOR)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des animateurs:', error);
      throw error;
    }
  }

  /**
   * Régénère le code d'accès d'une section (révocation de l'ancien code)
   */
  static async regenerateAccessCode(sectionId: string): Promise<string> {
    try {
      const section = await this.getSectionById(sectionId);
      if (!section) {
        throw new Error('Section non trouvée');
      }

      const newCode = this.generateAccessCode(section.sectionType);
      await this.updateSection(sectionId, { accessCode: newCode });
      return newCode;
    } catch (error) {
      console.error('Erreur lors de la régénération du code:', error);
      throw error;
    }
  }

  /**
   * Transfère le leadership de section à un autre animateur
   */
  static async transferSectionLeadership(
    sectionId: string,
    newLeaderId: string
  ): Promise<void> {
    try {
      const section = await this.getSectionById(sectionId);
      if (!section) {
        throw new Error('Section non trouvée');
      }

      // Retirer le statut de leader à l'ancien leader
      if (section.leaderId) {
        await UserService.updateUser(section.leaderId, {
          isSectionLeader: false,
        });
      }

      // Donner le statut de leader au nouveau
      await UserService.updateUser(newLeaderId, {
        isSectionLeader: true,
      });

      // Mettre à jour la section
      await this.updateSection(sectionId, { leaderId: newLeaderId });
    } catch (error) {
      console.error('Erreur lors du transfert de leadership:', error);
      throw error;
    }
  }

  /**
   * Retire un membre d'une section
   */
  static async removeMemberFromSection(userId: string): Promise<void> {
    try {
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Si c'est le leader de section, retirer aussi le statut
      const updates: Record<string, any> = {
        sectionId: '',
      };

      if (user.role === UserRole.ANIMATOR && (user as any).isSectionLeader) {
        updates.isSectionLeader = false;

        // Retirer aussi le leaderId de la section
        if ((user as any).sectionId) {
          await this.updateSection((user as any).sectionId, { leaderId: '' });
        }
      }

      await UserService.updateUser(userId, updates);
    } catch (error) {
      console.error('Erreur lors du retrait du membre:', error);
      throw error;
    }
  }
}
