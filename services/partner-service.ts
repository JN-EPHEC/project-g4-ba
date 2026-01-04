import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Partner,
  PartnerOffer,
  Redemption,
  RedemptionWithDetails,
  PartnerWithOffers,
  RedemptionStatus,
  RedemptionApproval,
} from '@/types/partners';

/**
 * Service pour gérer les partenariats et récompenses
 */
export class PartnerService {
  private static readonly PARTNERS_COLLECTION = 'partners';
  private static readonly OFFERS_COLLECTION = 'partnerOffers';
  private static readonly REDEMPTIONS_COLLECTION = 'redemptions';

  /**
   * Génère un code promo unique au format WC-XXXXXX
   */
  private static generatePromoCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans O, 0, I, 1 pour éviter confusion
    let code = 'WC-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crée un nouveau partenaire
   */
  static async createPartner(data: {
    name: string;
    logo: string;
    category: Partner['category'];
    description: string;
    website?: string;
  }): Promise<Partner> {
    try {
      const partnerData = {
        name: data.name,
        logo: data.logo,
        category: data.category,
        description: data.description,
        website: data.website || '',
        isActive: true,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.PARTNERS_COLLECTION), partnerData);

      return {
        id: docRef.id,
        ...partnerData,
        createdAt: new Date(),
      } as Partner;
    } catch (error) {
      console.error('Erreur createPartner:', error);
      throw error;
    }
  }

  /**
   * Met à jour un partenaire existant
   */
  static async updatePartner(
    partnerId: string,
    data: Partial<{
      name: string;
      logo: string;
      category: Partner['category'];
      description: string;
      website: string;
    }>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.PARTNERS_COLLECTION, partnerId), data);
    } catch (error) {
      console.error('Erreur updatePartner:', error);
      throw error;
    }
  }

  /**
   * Supprime un partenaire (soft delete - désactive)
   */
  static async deletePartner(partnerId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.PARTNERS_COLLECTION, partnerId), {
        isActive: false,
      });
    } catch (error) {
      console.error('Erreur deletePartner:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle offre partenaire
   */
  static async createOffer(data: {
    partnerId: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    pointsCost: number;
    validityDays: number;
    maxRedemptions?: number;
    minPurchase?: number;
  }): Promise<PartnerOffer> {
    try {
      const offerData = {
        partnerId: data.partnerId,
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        pointsCost: data.pointsCost,
        validityDays: data.validityDays,
        maxRedemptions: data.maxRedemptions || null,
        minPurchase: data.minPurchase || null,
        currentRedemptions: 0,
        isActive: true,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.OFFERS_COLLECTION), offerData);

      return {
        id: docRef.id,
        ...offerData,
        createdAt: new Date(),
      } as PartnerOffer;
    } catch (error) {
      console.error('Erreur createOffer:', error);
      throw error;
    }
  }

  /**
   * Met à jour une offre existante
   */
  static async updateOffer(
    offerId: string,
    data: Partial<{
      title: string;
      description: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      pointsCost: number;
      validityDays: number;
      maxRedemptions: number | null;
      minPurchase: number | null;
      isActive: boolean;
    }>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.OFFERS_COLLECTION, offerId), data);
    } catch (error) {
      console.error('Erreur updateOffer:', error);
      throw error;
    }
  }

  /**
   * Supprime une offre (soft delete - désactive)
   */
  static async deleteOffer(offerId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.OFFERS_COLLECTION, offerId), {
        isActive: false,
      });
    } catch (error) {
      console.error('Erreur deleteOffer:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les partenaires actifs
   */
  static async getPartners(): Promise<Partner[]> {
    try {
      const q = query(
        collection(db, this.PARTNERS_COLLECTION),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);

      const partners = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Partner[];

      // Tri côté client pour éviter l'index composite
      return partners.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erreur getPartners:', error);
      return [];
    }
  }

  /**
   * Récupère un partenaire par son ID avec ses offres
   */
  static async getPartnerWithOffers(partnerId: string): Promise<PartnerWithOffers | null> {
    try {
      const partnerDoc = await getDoc(doc(db, this.PARTNERS_COLLECTION, partnerId));
      if (!partnerDoc.exists()) return null;

      const partner = {
        id: partnerDoc.id,
        ...partnerDoc.data(),
        createdAt: partnerDoc.data().createdAt?.toDate() || new Date(),
      } as Partner;

      const offers = await this.getOffersByPartner(partnerId);

      return {
        ...partner,
        offers,
        activeOffersCount: offers.filter((o) => o.isActive).length,
      };
    } catch (error) {
      console.error('Erreur getPartnerWithOffers:', error);
      return null;
    }
  }

  /**
   * Récupère les offres d'un partenaire
   */
  static async getOffersByPartner(partnerId: string): Promise<PartnerOffer[]> {
    try {
      const q = query(
        collection(db, this.OFFERS_COLLECTION),
        where('partnerId', '==', partnerId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PartnerOffer[];
    } catch (error) {
      console.error('Erreur getOffersByPartner:', error);
      return [];
    }
  }

  /**
   * Récupère une offre par son ID
   */
  static async getOfferById(offerId: string): Promise<PartnerOffer | null> {
    try {
      const offerDoc = await getDoc(doc(db, this.OFFERS_COLLECTION, offerId));
      if (!offerDoc.exists()) return null;

      return {
        id: offerDoc.id,
        ...offerDoc.data(),
        createdAt: offerDoc.data().createdAt?.toDate() || new Date(),
      } as PartnerOffer;
    } catch (error) {
      console.error('Erreur getOfferById:', error);
      return null;
    }
  }

  /**
   * Récupère toutes les offres actives (pour l'aperçu)
   */
  static async getAllActiveOffers(): Promise<(PartnerOffer & { partner: Partner })[]> {
    try {
      const offersQuery = query(
        collection(db, this.OFFERS_COLLECTION),
        where('isActive', '==', true)
      );
      const offersSnapshot = await getDocs(offersQuery);
      const offers = offersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PartnerOffer[];

      // Récupérer les partenaires
      const partners = await this.getPartners();
      const partnersMap = new Map(partners.map((p) => [p.id, p]));

      return offers
        .filter((offer) => partnersMap.has(offer.partnerId))
        .map((offer) => ({
          ...offer,
          partner: partnersMap.get(offer.partnerId)!,
        }));
    } catch (error) {
      console.error('Erreur getAllActiveOffers:', error);
      return [];
    }
  }

  /**
   * Calcule le solde de points d'une unité (somme des points de tous les scouts)
   */
  static async getUnitPointsBalance(unitId: string): Promise<number> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('unitId', '==', unitId),
        where('role', '==', 'scout')
      );
      const usersSnapshot = await getDocs(usersQuery);

      let totalPoints = 0;
      usersSnapshot.docs.forEach((doc) => {
        totalPoints += doc.data().points || 0;
      });

      return totalPoints;
    } catch (error) {
      console.error('Erreur getUnitPointsBalance:', error);
      return 0;
    }
  }

  /**
   * Nombre d'approbations requises pour valider un échange
   */
  static readonly REQUIRED_APPROVALS = 3;

  /**
   * Demande un échange de points (nécessite 3 approbations d'animateurs)
   * Crée une demande en attente de validation
   */
  static async requestRedemption(
    offerId: string,
    requestedBy: string,
    requesterName: string,
    unitId: string
  ): Promise<{ success: boolean; redemption?: Redemption; error?: string }> {
    try {
      // 1. Récupérer l'offre
      const offer = await this.getOfferById(offerId);
      if (!offer) {
        return { success: false, error: 'Offre introuvable' };
      }

      if (!offer.isActive) {
        return { success: false, error: 'Cette offre n\'est plus disponible' };
      }

      // 2. Vérifier le solde de points de l'unité
      const unitBalance = await this.getUnitPointsBalance(unitId);
      if (unitBalance < offer.pointsCost) {
        return {
          success: false,
          error: `Solde insuffisant. Vous avez ${unitBalance} points, cette offre coûte ${offer.pointsCost} points.`,
        };
      }

      // 3. Vérifier limite de rédemptions
      if (offer.maxRedemptions && offer.currentRedemptions >= offer.maxRedemptions) {
        return { success: false, error: 'Cette offre a atteint sa limite d\'échanges' };
      }

      // 4. Vérifier qu'il n'y a pas déjà une demande en attente pour cette offre
      const pendingQuery = query(
        collection(db, this.REDEMPTIONS_COLLECTION),
        where('unitId', '==', unitId),
        where('offerId', '==', offerId),
        where('status', '==', 'pending_approval')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      if (!pendingSnapshot.empty) {
        return { success: false, error: 'Une demande est déjà en attente pour cette offre' };
      }

      // 5. Créer la demande de rédemption (sans code, en attente d'approbation)
      const redemptionData = {
        offerId,
        partnerId: offer.partnerId,
        requestedBy,
        requesterName, // Pour afficher le nom de qui a fait la demande
        unitId,
        pointsSpent: offer.pointsCost,
        status: 'pending_approval' as RedemptionStatus,
        approvals: [] as RedemptionApproval[],
        requiredApprovals: this.REQUIRED_APPROVALS,
        createdAt: Timestamp.now(),
      };

      const redemptionRef = await addDoc(collection(db, this.REDEMPTIONS_COLLECTION), redemptionData);

      return {
        success: true,
        redemption: {
          id: redemptionRef.id,
          ...redemptionData,
          createdAt: new Date(),
        } as unknown as Redemption,
      };
    } catch (error: any) {
      console.error('Erreur requestRedemption:', error);
      return { success: false, error: error?.message || 'Erreur lors de la demande' };
    }
  }

  /**
   * Approuve une demande d'échange (un animateur vote pour)
   * Si 3 approbations sont atteintes, l'échange est validé et les points déduits
   */
  static async approveRedemption(
    redemptionId: string,
    animatorId: string,
    animatorName: string
  ): Promise<{ success: boolean; isFullyApproved: boolean; code?: string; error?: string }> {
    try {
      const redemptionDoc = await getDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId));
      if (!redemptionDoc.exists()) {
        return { success: false, isFullyApproved: false, error: 'Demande introuvable' };
      }

      const redemption = {
        id: redemptionDoc.id,
        ...redemptionDoc.data(),
      } as Redemption & { requesterName?: string };

      // Vérifier le statut
      if (redemption.status !== 'pending_approval') {
        return { success: false, isFullyApproved: false, error: 'Cette demande n\'est plus en attente' };
      }

      // Vérifier que l'animateur n'a pas déjà approuvé
      const approvals = redemption.approvals || [];
      if (approvals.some(a => a.animatorId === animatorId)) {
        return { success: false, isFullyApproved: false, error: 'Vous avez déjà approuvé cette demande' };
      }

      // Ajouter l'approbation
      const newApproval: RedemptionApproval = {
        animatorId,
        animatorName,
        approvedAt: new Date(),
      };
      approvals.push(newApproval);

      // Vérifier si on atteint le nombre requis
      const isFullyApproved = approvals.length >= this.REQUIRED_APPROVALS;

      if (isFullyApproved) {
        // Récupérer l'offre pour la validité
        const offer = await this.getOfferById(redemption.offerId);
        if (!offer) {
          return { success: false, isFullyApproved: false, error: 'Offre introuvable' };
        }

        // Vérifier à nouveau le solde (peut avoir changé)
        const unitBalance = await this.getUnitPointsBalance(redemption.unitId);
        if (unitBalance < redemption.pointsSpent) {
          await updateDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId), {
            status: 'rejected',
            rejectionReason: 'Solde insuffisant au moment de la validation',
          });
          return { success: false, isFullyApproved: false, error: 'Solde insuffisant' };
        }

        // Générer le code et finaliser
        const code = this.generatePromoCode();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + offer.validityDays);

        await updateDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId), {
          approvals: approvals.map(a => ({
            ...a,
            approvedAt: a.approvedAt instanceof Date ? Timestamp.fromDate(a.approvedAt) : a.approvedAt,
          })),
          status: 'active',
          code,
          approvedAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt),
        });

        // Mettre à jour le compteur de rédemptions
        await updateDoc(doc(db, this.OFFERS_COLLECTION, redemption.offerId), {
          currentRedemptions: offer.currentRedemptions + 1,
        });

        // Déduire les points
        await this.deductPointsFromUnit(redemption.unitId, redemption.pointsSpent);

        return { success: true, isFullyApproved: true, code };
      } else {
        // Juste ajouter l'approbation
        await updateDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId), {
          approvals: approvals.map(a => ({
            ...a,
            approvedAt: a.approvedAt instanceof Date ? Timestamp.fromDate(a.approvedAt) : a.approvedAt,
          })),
        });

        return { success: true, isFullyApproved: false };
      }
    } catch (error: any) {
      console.error('Erreur approveRedemption:', error);
      return { success: false, isFullyApproved: false, error: error?.message || 'Erreur lors de l\'approbation' };
    }
  }

  /**
   * Rejette une demande d'échange
   */
  static async rejectRedemption(
    redemptionId: string,
    animatorId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const redemptionDoc = await getDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId));
      if (!redemptionDoc.exists()) {
        return { success: false, error: 'Demande introuvable' };
      }

      const redemption = redemptionDoc.data();
      if (redemption.status !== 'pending_approval') {
        return { success: false, error: 'Cette demande n\'est plus en attente' };
      }

      await updateDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId), {
        status: 'rejected',
        rejectedBy: animatorId,
        rejectionReason: reason || 'Rejeté par un animateur',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur rejectRedemption:', error);
      return { success: false, error: error?.message || 'Erreur lors du rejet' };
    }
  }

  /**
   * Récupère les demandes d'échange en attente pour une unité
   */
  static async getPendingRedemptions(unitId: string): Promise<RedemptionWithDetails[]> {
    try {
      const q = query(
        collection(db, this.REDEMPTIONS_COLLECTION),
        where('unitId', '==', unitId),
        where('status', '==', 'pending_approval'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const redemptions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        approvals: (docSnap.data().approvals || []).map((a: any) => ({
          ...a,
          approvedAt: a.approvedAt?.toDate?.() || new Date(),
        })),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as Redemption[];

      // Enrichir avec les détails
      const partners = await this.getPartners();
      const partnersMap = new Map(partners.map((p) => [p.id, p]));

      const enrichedRedemptions: RedemptionWithDetails[] = [];

      for (const redemption of redemptions) {
        const offer = await this.getOfferById(redemption.offerId);
        const partner = partnersMap.get(redemption.partnerId);

        if (offer && partner) {
          enrichedRedemptions.push({
            ...redemption,
            offer,
            partner,
          });
        }
      }

      return enrichedRedemptions;
    } catch (error) {
      console.error('Erreur getPendingRedemptions:', error);
      return [];
    }
  }

  /**
   * Compte le nombre de demandes en attente pour une unité
   */
  static async getPendingRedemptionsCount(unitId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.REDEMPTIONS_COLLECTION),
        where('unitId', '==', unitId),
        where('status', '==', 'pending_approval')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Erreur getPendingRedemptionsCount:', error);
      return 0;
    }
  }

  /**
   * Déduit des points des scouts d'une unité (répartition proportionnelle)
   */
  private static async deductPointsFromUnit(unitId: string, pointsToDeduct: number): Promise<void> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('unitId', '==', unitId),
        where('role', '==', 'scout')
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) return;

      // Calculer le total des points
      let totalPoints = 0;
      const scouts: { id: string; points: number }[] = [];

      usersSnapshot.docs.forEach((doc) => {
        const points = doc.data().points || 0;
        totalPoints += points;
        scouts.push({ id: doc.id, points });
      });

      if (totalPoints === 0) return;

      // Déduire proportionnellement
      for (const scout of scouts) {
        const proportion = scout.points / totalPoints;
        const deduction = Math.floor(pointsToDeduct * proportion);

        if (deduction > 0) {
          await updateDoc(doc(db, 'users', scout.id), {
            points: Math.max(0, scout.points - deduction),
          });
        }
      }
    } catch (error) {
      console.error('Erreur deductPointsFromUnit:', error);
    }
  }

  /**
   * Récupère l'historique des rédemptions d'une unité
   */
  static async getUnitRedemptions(unitId: string): Promise<RedemptionWithDetails[]> {
    try {
      const q = query(
        collection(db, this.REDEMPTIONS_COLLECTION),
        where('unitId', '==', unitId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const redemptions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        expiresAt: docSnap.data().expiresAt?.toDate(),
        approvedAt: docSnap.data().approvedAt?.toDate(),
        usedAt: docSnap.data().usedAt?.toDate(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        approvals: (docSnap.data().approvals || []).map((a: any) => ({
          ...a,
          approvedAt: a.approvedAt?.toDate?.() || new Date(),
        })),
      })) as Redemption[];

      // Enrichir avec les détails des offres et partenaires
      const partners = await this.getPartners();
      const partnersMap = new Map(partners.map((p) => [p.id, p]));

      const enrichedRedemptions: RedemptionWithDetails[] = [];

      for (const redemption of redemptions) {
        const offer = await this.getOfferById(redemption.offerId);
        const partner = partnersMap.get(redemption.partnerId);

        if (offer && partner) {
          // Mettre à jour le statut si expiré
          let status = redemption.status;
          if (status === 'active' && redemption.expiresAt && new Date() > redemption.expiresAt) {
            status = 'expired';
          }

          enrichedRedemptions.push({
            ...redemption,
            status,
            offer,
            partner,
          });
        }
      }

      return enrichedRedemptions;
    } catch (error) {
      console.error('Erreur getUnitRedemptions:', error);
      return [];
    }
  }

  /**
   * Marque une rédemption comme utilisée
   */
  static async markRedemptionAsUsed(redemptionId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, this.REDEMPTIONS_COLLECTION, redemptionId), {
        status: 'used',
        usedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Erreur markRedemptionAsUsed:', error);
      return false;
    }
  }

  /**
   * Initialise les partenaires de test (à appeler une fois)
   */
  static async seedTestPartners(): Promise<void> {
    try {
      // Vérifier si les partenaires existent déjà
      const existingPartners = await this.getPartners();
      if (existingPartners.length > 0) {
        console.log('Partenaires déjà initialisés');
        return;
      }

      // Partenaires de test
      const testPartners = [
        {
          name: 'Colruyt',
          logo: '🛒',
          category: 'alimentation',
          description: 'Supermarché belge - produits de qualité au meilleur prix',
          website: 'https://www.colruyt.be',
          isActive: true,
          createdAt: Timestamp.now(),
        },
        {
          name: 'Brico',
          logo: '🔨',
          category: 'bricolage',
          description: 'Tout pour le bricolage et l\'aménagement',
          website: 'https://www.brico.be',
          isActive: true,
          createdAt: Timestamp.now(),
        },
        {
          name: 'Decathlon',
          logo: '⚽',
          category: 'sport',
          description: 'Équipement sportif pour tous',
          website: 'https://www.decathlon.be',
          isActive: true,
          createdAt: Timestamp.now(),
        },
        {
          name: 'AS Adventure',
          logo: '🏕️',
          category: 'outdoor',
          description: 'Spécialiste de l\'outdoor et du camping',
          website: 'https://www.asadventure.com',
          isActive: true,
          createdAt: Timestamp.now(),
        },
      ];

      // Créer les partenaires
      const partnerIds: string[] = [];
      for (const partner of testPartners) {
        const ref = await addDoc(collection(db, this.PARTNERS_COLLECTION), partner);
        partnerIds.push(ref.id);
      }

      // Offres de test
      const testOffers = [
        {
          partnerId: partnerIds[0], // Colruyt
          title: '10% sur les courses',
          description: 'Réduction de 10% sur votre prochain passage en caisse',
          discountType: 'percentage',
          discountValue: 10,
          pointsCost: 500,
          validityDays: 30,
          currentRedemptions: 0,
          isActive: true,
          createdAt: Timestamp.now(),
        },
        {
          partnerId: partnerIds[1], // Brico
          title: '15% matériel camping',
          description: '15% de réduction sur le matériel de camping',
          discountType: 'percentage',
          discountValue: 15,
          pointsCost: 750,
          validityDays: 45,
          currentRedemptions: 0,
          isActive: true,
          createdAt: Timestamp.now(),
        },
        {
          partnerId: partnerIds[2], // Decathlon
          title: '20€ dès 100€ d\'achat',
          description: '20€ de réduction pour tout achat de 100€ ou plus',
          discountType: 'fixed',
          discountValue: 20,
          pointsCost: 1000,
          minPurchase: 100,
          validityDays: 60,
          currentRedemptions: 0,
          isActive: true,
          createdAt: Timestamp.now(),
        },
        {
          partnerId: partnerIds[3], // AS Adventure
          title: '10% équipement outdoor',
          description: '10% sur tout l\'équipement outdoor',
          discountType: 'percentage',
          discountValue: 10,
          pointsCost: 600,
          validityDays: 30,
          currentRedemptions: 0,
          isActive: true,
          createdAt: Timestamp.now(),
        },
      ];

      for (const offer of testOffers) {
        await addDoc(collection(db, this.OFFERS_COLLECTION), offer);
      }

      console.log('Partenaires et offres de test créés avec succès');
    } catch (error) {
      console.error('Erreur seedTestPartners:', error);
    }
  }
}
