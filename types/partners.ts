/**
 * Types pour le système de partenariats et récompenses
 */

export interface Partner {
  id: string;
  name: string;
  logo: string; // URL ou emoji
  category: PartnerCategory;
  description: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
}

export type PartnerCategory = 'alimentation' | 'sport' | 'bricolage' | 'outdoor' | 'autre';

export interface PartnerOffer {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // 10 pour 10% ou 20 pour 20€
  pointsCost: number;
  minPurchase?: number; // Montant minimum d'achat (pour les offres "X€ dès Y€")
  validityDays: number; // Nombre de jours de validité après échange
  maxRedemptions?: number; // Limite d'échanges total (optionnel)
  currentRedemptions: number;
  isActive: boolean;
  createdAt: Date;
}

export interface RedemptionApproval {
  animatorId: string;
  animatorName: string;
  approvedAt: Date;
}

export interface Redemption {
  id: string;
  offerId: string;
  partnerId: string;
  requestedBy: string; // ID de l'animateur qui a fait la demande
  unitId: string;
  pointsSpent: number;
  code?: string; // Code unique généré "WC-XXXXXX" - généré uniquement après approbation
  status: RedemptionStatus;
  // Système d'approbation par 3 animateurs
  approvals: RedemptionApproval[];
  requiredApprovals: number; // Nombre d'approbations requises (3)
  approvedAt?: Date; // Date à laquelle les 3 approbations ont été obtenues
  rejectedBy?: string; // ID de l'animateur qui a rejeté (optionnel)
  rejectionReason?: string;
  expiresAt?: Date; // Date d'expiration du code (définie après approbation)
  usedAt?: Date;
  createdAt: Date;
}

export type RedemptionStatus = 'pending_approval' | 'approved' | 'active' | 'used' | 'expired' | 'rejected';

// Types pour les données enrichies (avec infos partenaire/offre)
export interface RedemptionWithDetails extends Redemption {
  offer: PartnerOffer;
  partner: Partner;
}

export interface PartnerWithOffers extends Partner {
  offers: PartnerOffer[];
  activeOffersCount: number;
}

// Type pour le solde de points d'une unité
export interface UnitPointsBalance {
  unitId: string;
  totalPoints: number;
  lastUpdated: Date;
}
