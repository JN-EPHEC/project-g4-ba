import { db } from '@/config/firebase';
import { ScoutGroup, Unit, UnitCategory, UserRole } from '@/types';
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
 * Service pour gérer les unités scoutes
 */
export class UnitService {
  private static readonly UNITS_COLLECTION = 'units';
  private static readonly GROUPS_COLLECTION = 'scoutGroups';

  /**
   * Convertit un document Firestore en unité
   */
  private static convertUnit(data: DocumentData): Unit {
    return {
      id: data.id,
      name: data.name,
      category: data.category as UnitCategory,
      description: data.description,
      logoUrl: data.logoUrl,
      groupId: data.groupId,
      leaderId: data.leaderId,
      accessCode: data.accessCode,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Convertit un document Firestore en groupe scout
   */
  private static convertGroup(data: DocumentData): ScoutGroup {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      email: data.email,
      phone: data.phone,
      logoUrl: data.logoUrl,
      website: data.website,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Crée une nouvelle unité
   */
  static async createUnit(
    name: string,
    category: UnitCategory,
    groupId: string,
    leaderId: string,
    description?: string,
    logoUrl?: string
  ): Promise<Unit> {
    try {
      const now = new Date();
      const unitData = {
        name,
        category,
        groupId,
        leaderId,
        description,
        logoUrl,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Vérifier que le leader existe et est un animateur
      const leader = await UserService.getUserById(leaderId);
      if (!leader || leader.role !== UserRole.ANIMATOR) {
        throw new Error('Le leader doit être un animateur');
      }

      // Créer l'unité
      const unitRef = doc(collection(db, this.UNITS_COLLECTION));
      await setDoc(unitRef, unitData);

      // Mettre à jour l'unité du leader
      await UserService.updateUser(leaderId, { unitId: unitRef.id });

      return this.convertUnit({ id: unitRef.id, ...unitData });
    } catch (error) {
      console.error('Erreur lors de la création de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle unité sans vérifier que le leader existe
   * Utilisé lors de l'inscription d'un animateur qui crée son unité
   */
  static async createUnitWithoutValidation(
    name: string,
    category: UnitCategory,
    groupId: string,
    leaderId: string,
    description?: string,
    logoUrl?: string,
    accessCode?: string
  ): Promise<Unit> {
    try {
      const now = new Date();
      const unitData: Record<string, any> = {
        name,
        category,
        groupId,
        leaderId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (description) unitData.description = description;
      if (logoUrl) unitData.logoUrl = logoUrl;
      if (accessCode) unitData.accessCode = accessCode;

      // Créer l'unité sans vérification du leader
      const unitRef = doc(collection(db, this.UNITS_COLLECTION));
      await setDoc(unitRef, unitData);

      return this.convertUnit({ id: unitRef.id, ...unitData });
    } catch (error) {
      console.error('Erreur lors de la création de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Met à jour une unité
   */
  static async updateUnit(
    unitId: string,
    updates: Partial<Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const unitRef = doc(db, this.UNITS_COLLECTION, unitId);
      await updateDoc(unitRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      // Si le leader change, mettre à jour les unités des animateurs
      if (updates.leaderId) {
        const unit = await this.getUnitById(unitId);
        if (unit) {
          // Mettre à jour l'ancien leader
          const oldLeader = await UserService.getUserById(unit.leaderId);
          if (oldLeader && oldLeader.role === UserRole.ANIMATOR) {
            await UserService.updateUser(unit.leaderId, { unitId: '' });
          }

          // Mettre à jour le nouveau leader
          await UserService.updateUser(updates.leaderId, { unitId });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Récupère une unité par son ID
   */
  static async getUnitById(unitId: string): Promise<Unit | null> {
    try {
      const unitDoc = await getDoc(doc(db, this.UNITS_COLLECTION, unitId));

      if (!unitDoc.exists()) {
        return null;
      }

      return this.convertUnit({ id: unitDoc.id, ...unitDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les unités d'un groupe
   */
  static async getUnitsByGroup(groupId: string): Promise<Unit[]> {
    try {
      const q = query(
        collection(db, this.UNITS_COLLECTION),
        where('groupId', '==', groupId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertUnit({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des unités:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les unités
   */
  static async getAllUnits(): Promise<Unit[]> {
    try {
      const querySnapshot = await getDocs(
        collection(db, this.UNITS_COLLECTION)
      );
      return querySnapshot.docs.map((doc) =>
        this.convertUnit({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les unités:', error);
      throw error;
    }
  }

  /**
   * Assigne un scout à une unité
   */
  static async assignScoutToUnit(scoutId: string, unitId: string): Promise<void> {
    try {
      // Vérifier que l'unité existe
      const unit = await this.getUnitById(unitId);
      if (!unit) {
        throw new Error('L\'unité n\'existe pas');
      }

      // Vérifier que le scout existe
      const scout = await UserService.getUserById(scoutId);
      if (!scout || scout.role !== UserRole.SCOUT) {
        throw new Error('L\'utilisateur n\'existe pas ou n\'est pas un scout');
      }

      // Mettre à jour l'unité du scout
      await UserService.updateUser(scoutId, { unitId });
    } catch (error) {
      console.error('Erreur lors de l\'assignation du scout:', error);
      throw error;
    }
  }

  /**
   * Retire un scout d'une unité
   */
  static async removeScoutFromUnit(scoutId: string): Promise<void> {
    try {
      const scout = await UserService.getUserById(scoutId);
      if (!scout || scout.role !== UserRole.SCOUT) {
        throw new Error('L\'utilisateur n\'existe pas ou n\'est pas un scout');
      }

      await UserService.updateUser(scoutId, { unitId: '' });
    } catch (error) {
      console.error('Erreur lors du retrait du scout:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les scouts d'une unité
   */
  static async getScoutsByUnit(unitId: string): Promise<any[]> {
    try {
      console.log('🔍 getScoutsByUnit - Recherche pour unitId:', unitId);

      // Récupérer tous les utilisateurs de l'unité, puis filtrer par rôle
      // (évite les problèmes d'index composite Firestore)
      const q = query(
        collection(db, 'users'),
        where('unitId', '==', unitId)
      );

      const querySnapshot = await getDocs(q);
      console.log('📋 Utilisateurs trouvés dans l\'unité:', querySnapshot.docs.length);

      // Filtrer pour ne garder que les scouts
      const scouts = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user: any) => user.role === UserRole.SCOUT || user.role === 'scout');

      console.log('👦 Scouts filtrés:', scouts.length);
      scouts.forEach((s: any) => {
        console.log(`  - ${s.firstName} ${s.lastName}, validated: ${s.validated}`);
      });

      return scouts;
    } catch (error) {
      console.error('Erreur lors de la récupération des scouts:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les animateurs d'une unité
   */
  static async getAnimatorsByUnit(unitId: string): Promise<any[]> {
    try {
      // Récupérer tous les utilisateurs de l'unité, puis filtrer par rôle
      // (évite les problèmes d'index composite Firestore)
      const q = query(
        collection(db, 'users'),
        where('unitId', '==', unitId)
      );

      const querySnapshot = await getDocs(q);

      // Filtrer pour ne garder que les animateurs
      return querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user: any) => user.role === UserRole.ANIMATOR || user.role === 'animator');
    } catch (error) {
      console.error('Erreur lors de la récupération des animateurs:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les membres d'une unité (scouts + animateurs)
   */
  static async getUnitMembers(unitId: string): Promise<{ id: string; firstName: string; lastName: string; role: UserRole }[]> {
    try {
      // Récupérer tous les utilisateurs de l'unité
      const q = query(
        collection(db, 'users'),
        where('unitId', '==', unitId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          role: data.role as UserRole,
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
      throw error;
    }
  }

  /**
   * Supprime une unité
   */
  static async deleteUnit(unitId: string): Promise<void> {
    try {
      const unit = await this.getUnitById(unitId);
      if (!unit) {
        throw new Error('L\'unité n\'existe pas');
      }

      // Retirer tous les scouts de l'unité
      const scouts = await this.getScoutsByUnit(unitId);
      await Promise.all(
        scouts.map((scout) => this.removeScoutFromUnit(scout.id))
      );

      // Retirer le leader de l'unité
      await UserService.updateUser(unit.leaderId, { unitId: '' });

      // Supprimer l'unité
      await deleteDoc(doc(db, this.UNITS_COLLECTION, unitId));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau groupe scout
   */
  static async createGroup(
    name: string,
    address: string,
    city: string,
    postalCode: string,
    email: string,
    phone: string,
    logoUrl?: string,
    website?: string
  ): Promise<ScoutGroup> {
    try {
      const now = new Date();
      const groupData = {
        name,
        address,
        city,
        postalCode,
        email,
        phone,
        logoUrl,
        website,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const groupRef = doc(collection(db, this.GROUPS_COLLECTION));
      await setDoc(groupRef, groupData);

      return this.convertGroup({ id: groupRef.id, ...groupData });
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
      throw error;
    }
  }

  /**
   * Récupère un groupe par son ID
   */
  static async getGroupById(groupId: string): Promise<ScoutGroup | null> {
    try {
      const groupDoc = await getDoc(doc(db, this.GROUPS_COLLECTION, groupId));

      if (!groupDoc.exists()) {
        return null;
      }

      return this.convertGroup({ id: groupDoc.id, ...groupDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération du groupe:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les groupes
   */
  static async getAllGroups(): Promise<ScoutGroup[]> {
    try {
      const querySnapshot = await getDocs(
        collection(db, this.GROUPS_COLLECTION)
      );
      return querySnapshot.docs.map((doc) =>
        this.convertGroup({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes:', error);
      throw error;
    }
  }

  // ==================== MÉTHODES ADMIN WECAMP ====================

  /**
   * Génère un code d'accès unique pour une unité
   * Format: UNIT-XXXXXX (6 caractères alphanumériques)
   */
  static generateAccessCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'UNIT-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crée une unité via le panel admin WeCamp
   * Génère automatiquement un code d'accès unique
   * L'unité est créée sans leader initial (le premier animateur à rejoindre devient leader)
   */
  static async createUnitByAdmin(
    name: string,
    category: UnitCategory,
    description?: string,
    logoUrl?: string
  ): Promise<Unit> {
    try {
      const accessCode = this.generateAccessCode();
      const now = new Date();

      const unitData: Record<string, any> = {
        name,
        category,
        groupId: 'wecamp-global', // Groupe par défaut pour les unités créées par admin
        leaderId: '', // Pas de leader initial
        accessCode,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      if (description) unitData.description = description;
      if (logoUrl) unitData.logoUrl = logoUrl;

      const unitRef = doc(collection(db, this.UNITS_COLLECTION));
      await setDoc(unitRef, unitData);

      return this.convertUnit({ id: unitRef.id, ...unitData });
    } catch (error) {
      console.error('Erreur lors de la création de l\'unité par admin:', error);
      throw error;
    }
  }

  /**
   * Recherche une unité par son code d'accès
   */
  static async getUnitByAccessCode(accessCode: string): Promise<Unit | null> {
    try {
      const q = query(
        collection(db, this.UNITS_COLLECTION),
        where('accessCode', '==', accessCode.toUpperCase())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const unitDoc = querySnapshot.docs[0];
      return this.convertUnit({ id: unitDoc.id, ...unitDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la recherche par code d\'accès:', error);
      throw error;
    }
  }

  /**
   * Permet à un animateur de rejoindre une unité via son code d'accès
   * Le premier animateur à rejoindre devient automatiquement chef d'unité (isUnitLeader: true)
   */
  static async joinUnitAsAnimator(
    animatorId: string,
    accessCode: string
  ): Promise<{ unit: Unit; isLeader: boolean }> {
    try {
      // Trouver l'unité par code
      const unit = await this.getUnitByAccessCode(accessCode);

      if (!unit) {
        throw new Error('Code d\'unité invalide');
      }

      // Vérifier si c'est le premier animateur (devient leader)
      const isFirstAnimator = !unit.leaderId || unit.leaderId === '';

      // Mettre à jour l'animateur avec l'unitId et le statut de leader
      await UserService.updateUser(animatorId, {
        unitId: unit.id,
        isUnitLeader: isFirstAnimator,
      });

      // Si premier animateur, mettre à jour l'unité avec le leaderId
      if (isFirstAnimator) {
        await this.updateUnit(unit.id, { leaderId: animatorId });
      }

      return { unit, isLeader: isFirstAnimator };
    } catch (error) {
      console.error('Erreur lors de la jonction à l\'unité:', error);
      throw error;
    }
  }

  /**
   * Régénère le code d'accès d'une unité (révocation de l'ancien code)
   */
  static async regenerateAccessCode(unitId: string): Promise<string> {
    try {
      const newCode = this.generateAccessCode();
      await this.updateUnit(unitId, { accessCode: newCode });
      return newCode;
    } catch (error) {
      console.error('Erreur lors de la régénération du code:', error);
      throw error;
    }
  }
}

