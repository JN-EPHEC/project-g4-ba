import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Text,
  Modal,
  Share,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { StorageService } from '@/src/shared/services/storage-service';
import { ChallengeService } from '@/src/features/challenges/services/challenge-service';
import { AdminStatsService, GlobalStats, ChallengeStats, UnitStats } from '@/services/admin-stats-service';
import { PartnerService } from '@/services/partner-service';
import { BadgeService } from '@/services/badge-service';
import { Challenge, BadgeDefinition, BadgeCategory, BadgeCondition } from '@/types';
import { Partner, PartnerOffer, Redemption } from '@/types/partners';

// Design System
const colors = {
  primary: '#2D5A45',
  primaryLight: '#3d7a5a',
  accent: '#E07B4C',
  accentLight: '#FEF3EE',
  neutral: '#8B7E74',
  neutralLight: '#C4BBB3',
  dark: '#1A2E28',
  mist: '#E8EDE9',
  canvas: '#FDFCFB',
  cardBg: '#FFFFFF',
  danger: '#DC3545',
  dangerLight: '#FDEAEA',
  success: '#28A745',
  successLight: '#E8F5E9',
  warning: '#F5A623',
  warningLight: '#FEF7E6',
  blue: '#4A90D9',
  blueLight: '#EBF4FF',
  purple: '#7B1FA2',
  purpleLight: '#F3E5F5',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

type TabType = 'dashboard' | 'defis' | 'unites' | 'classement' | 'partenaires' | 'badges';

interface TabInfo {
  key: TabType;
  label: string;
  icon: string;
}

export default function WeCampDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeChallengeFilter, setActiveChallengeFilter] = useState('tous');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats[]>([]);
  const [unitRanking, setUnitRanking] = useState<UnitStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Partners state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allOffers, setAllOffers] = useState<(PartnerOffer & { partner: Partner })[]>([]);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [activePartnerTab, setActivePartnerTab] = useState<'partenaires' | 'offres'>('partenaires');
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingOffer, setEditingOffer] = useState<(PartnerOffer & { partner: Partner }) | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);

  // Unit detail modal
  const [selectedUnit, setSelectedUnit] = useState<UnitStats | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Partner context menu
  const [selectedPartnerForMenu, setSelectedPartnerForMenu] = useState<Partner | null>(null);

  // Offer context menu
  const [selectedOfferForMenu, setSelectedOfferForMenu] = useState<(PartnerOffer & { partner: Partner }) | null>(null);

  // Challenge context menu
  const [selectedChallengeForMenu, setSelectedChallengeForMenu] = useState<Challenge | null>(null);

  // Profile menu
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Ranking period filter
  const [rankingPeriod, setRankingPeriod] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Partner form state
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    logo: '',
    category: 'alimentation' as Partner['category'],
    description: '',
    website: '',
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Offer form state
  const [offerForm, setOfferForm] = useState({
    partnerId: '',
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    pointsCost: '',
    validityDays: '30',
    maxRedemptions: '',
  });

  // Badges state
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [totalBadgesAwarded, setTotalBadgesAwarded] = useState(0);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [selectedBadgeForMenu, setSelectedBadgeForMenu] = useState<BadgeDefinition | null>(null);
  const [badgeSearchQuery, setBadgeSearchQuery] = useState('');

  // Badge form state
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: '',
    category: BadgeCategory.NATURE,
    conditionType: 'manual' as 'points' | 'challenges' | 'challenges_category' | 'manual',
    conditionValue: '',
    conditionCategory: '',
  });

  // Navigation tabs
  const tabs: TabInfo[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'defis', label: 'Défis', icon: '🎯' },
    { key: 'unites', label: 'Unités', icon: '🏕️' },
    { key: 'classement', label: 'Classement', icon: '🏆' },
    { key: 'partenaires', label: 'Partenaires', icon: '🎁' },
    { key: 'badges', label: 'Badges', icon: '🏅' },
  ];


  const loadData = useCallback(async () => {
    try {
      const [challengesData, stats, cStats, ranking, partnersData, offersData, badgesData, badgesAwarded] = await Promise.all([
        ChallengeService.getChallenges(),
        AdminStatsService.getGlobalStats(),
        AdminStatsService.getChallengeStats(),
        AdminStatsService.getUnitRanking(),
        PartnerService.getPartners(),
        PartnerService.getAllActiveOffers(),
        BadgeService.getAllBadgeDefinitionsAdmin(),
        BadgeService.getTotalBadgesAwarded(),
      ]);
      setChallenges(challengesData);
      setGlobalStats(stats);
      setChallengeStats(cStats);
      setUnitRanking(ranking);
      setPartners(partnersData);
      setAllOffers(offersData);
      setBadges(badgesData);
      setTotalBadgesAwarded(badgesAwarded);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleEditChallenge = () => {
    if (!selectedChallengeForMenu) return;
    router.push(`/(wecamp)/edit-challenge?id=${selectedChallengeForMenu.id}`);
    setSelectedChallengeForMenu(null);
  };

  const handleDeleteChallenge = async (challenge: Challenge) => {
    // Utiliser window.confirm pour la compatibilité web (Modal/Alert ne fonctionne pas sur web)
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer "${challenge.title}" ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    setDeletingId(challenge.id);

    try {
      console.log('Deleting challenge:', challenge.id);
      await ChallengeService.deleteChallenge(challenge.id);
      console.log('Challenge deleted successfully');
      setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    } catch (error: any) {
      console.error('Delete challenge error:', error);
      window.alert('Erreur: ' + (error?.message || 'Impossible de supprimer le défi'));
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { bg: colors.successLight, color: colors.success, label: 'Facile' };
      case 'medium':
        return { bg: colors.warningLight, color: colors.warning, label: 'Moyen' };
      case 'hard':
        return { bg: colors.dangerLight, color: colors.danger, label: 'Difficile' };
      default:
        return { bg: colors.mist, color: colors.neutral, label: difficulty };
    }
  };

  const getLevelColor = (level: string) => {
    const levelColors: Record<string, string> = {
      'Or': colors.gold,
      'Argent': colors.silver,
      'Bronze': colors.bronze,
    };
    return levelColors[level] || colors.neutral;
  };

  const getUnitLevel = (points: number): string => {
    if (points >= 10000) return 'Or';
    if (points >= 5000) return 'Argent';
    return 'Bronze';
  };

  // Export stats to clipboard/share
  const handleExportStats = async () => {
    const stats = `📊 Statistiques WeCamp - ${new Date().toLocaleDateString('fr-FR')}

🏕️ Unités: ${globalStats?.totalUnits || 0}
👥 Scouts: ${globalStats?.totalScouts || 0}
🎯 Défis actifs: ${challenges.length}
✅ Défis complétés: ${globalStats?.totalChallengesCompleted || 0}

🏆 Top 3 Unités:
${unitRanking.slice(0, 3).map((u, i) => `${i + 1}. ${u.unitName} - ${u.totalPoints} pts`).join('\n')}
`;

    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(stats);
        Alert.alert('Exporté!', 'Les statistiques ont été copiées dans le presse-papier.');
      } else {
        await Share.share({ message: stats, title: 'Statistiques WeCamp' });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Erreur', "Impossible d'exporter les statistiques");
    }
  };

  // Show unit detail modal
  const handleViewUnit = (unit: UnitStats) => {
    setSelectedUnit(unit);
    setShowUnitModal(true);
  };

  // Handle partner actions menu - ouvre le menu contextuel
  const handlePartnerMenu = (partner: Partner) => {
    setSelectedPartnerForMenu(partner);
  };

  // Actions du menu partenaire
  const handleEditPartner = () => {
    if (!selectedPartnerForMenu) return;
    setPartnerForm({
      name: selectedPartnerForMenu.name,
      logo: selectedPartnerForMenu.logo,
      category: selectedPartnerForMenu.category,
      description: selectedPartnerForMenu.description || '',
      website: selectedPartnerForMenu.website || '',
    });
    setEditingPartner(selectedPartnerForMenu);
    setSelectedPartnerForMenu(null);
    setShowPartnerForm(true);
  };

  const handleViewPartnerOffers = () => {
    if (!selectedPartnerForMenu) return;
    setActivePartnerTab('offres');
    setPartnerSearchQuery(selectedPartnerForMenu.name);
    setSelectedPartnerForMenu(null);
  };

  const handleDeletePartner = async () => {
    if (!selectedPartnerForMenu) return;
    try {
      await PartnerService.deletePartner(selectedPartnerForMenu.id);
      setPartners(partners.filter(p => p.id !== selectedPartnerForMenu.id));
      setSelectedPartnerForMenu(null);
      Alert.alert('Succès', 'Partenaire supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression partenaire:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le partenaire');
    }
  };

  // Handle offer actions menu
  const handleOfferMenu = (offer: PartnerOffer & { partner: Partner }) => {
    setSelectedOfferForMenu(offer);
  };

  // Actions du menu offre
  const handleEditOffer = () => {
    if (!selectedOfferForMenu) return;
    setOfferForm({
      partnerId: selectedOfferForMenu.partnerId,
      title: selectedOfferForMenu.title,
      description: selectedOfferForMenu.description || '',
      discountType: selectedOfferForMenu.discountType,
      discountValue: String(selectedOfferForMenu.discountValue),
      pointsCost: String(selectedOfferForMenu.pointsCost),
      validityDays: String(selectedOfferForMenu.validityDays),
      maxRedemptions: selectedOfferForMenu.maxRedemptions ? String(selectedOfferForMenu.maxRedemptions) : '',
    });
    setEditingOffer(selectedOfferForMenu);
    setSelectedOfferForMenu(null);
    setShowOfferForm(true);
  };

  const handleDeleteOffer = async () => {
    if (!selectedOfferForMenu) return;
    try {
      await PartnerService.deleteOffer(selectedOfferForMenu.id);
      setAllOffers(allOffers.filter(o => o.id !== selectedOfferForMenu.id));
      setSelectedOfferForMenu(null);
      Alert.alert('Succès', 'Offre supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression offre:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'offre');
    }
  };

  // Reset offer form
  const resetOfferForm = () => {
    setOfferForm({
      partnerId: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      pointsCost: '',
      validityDays: '30',
      maxRedemptions: '',
    });
    setEditingOffer(null);
  };

  // Save offer (create or update)
  const handleSaveOffer = async () => {
    console.log('🔄 handleSaveOffer appelé');
    console.log('📋 offerForm:', offerForm);

    // Validation
    if (!offerForm.partnerId) {
      console.log('❌ Pas de partenaire sélectionné');
      Alert.alert('Erreur', 'Veuillez sélectionner un partenaire');
      return;
    }
    if (!offerForm.title.trim()) {
      console.log('❌ Pas de titre');
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'offre');
      return;
    }
    if (!offerForm.discountValue || isNaN(Number(offerForm.discountValue))) {
      console.log('❌ Valeur de réduction invalide');
      Alert.alert('Erreur', 'Veuillez entrer une valeur de réduction valide');
      return;
    }
    if (!offerForm.pointsCost || isNaN(Number(offerForm.pointsCost))) {
      console.log('❌ Coût en points invalide');
      Alert.alert('Erreur', 'Veuillez entrer un coût en points valide');
      return;
    }

    setSavingOffer(true);
    console.log('✅ Validation passée, création de l\'offre...');

    try {
      const offerData = {
        partnerId: offerForm.partnerId,
        title: offerForm.title.trim(),
        description: offerForm.description?.trim() || '',
        discountType: offerForm.discountType,
        discountValue: Number(offerForm.discountValue),
        pointsCost: Number(offerForm.pointsCost),
        validityDays: Number(offerForm.validityDays) || 30,
        maxRedemptions: offerForm.maxRedemptions ? Number(offerForm.maxRedemptions) : undefined,
      };

      console.log('📤 offerData à envoyer:', offerData);

      if (editingOffer) {
        // Update existing offer
        console.log('🔄 Mise à jour offre existante:', editingOffer.id);
        await PartnerService.updateOffer(editingOffer.id, offerData);
        // Update local state
        setAllOffers(allOffers.map(o =>
          o.id === editingOffer.id
            ? { ...o, ...offerData }
            : o
        ));
        console.log('✅ Offre mise à jour');
        Alert.alert('Succès', 'Offre mise à jour avec succès');
      } else {
        // Create new offer
        console.log('➕ Création nouvelle offre...');
        const newOffer = await PartnerService.createOffer(offerData);
        console.log('✅ Offre créée:', newOffer);
        // Find partner for the offer
        const partner = partners.find(p => p.id === offerForm.partnerId);
        if (partner) {
          setAllOffers([...allOffers, { ...newOffer, partner }]);
          console.log('✅ State mis à jour avec la nouvelle offre');
        }
        Alert.alert('Succès', 'Offre créée avec succès');
      }

      setShowOfferForm(false);
      resetOfferForm();
    } catch (error) {
      console.error('❌ Erreur sauvegarde offre:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'offre');
    } finally {
      setSavingOffer(false);
    }
  };

  const filteredUnits = unitRanking.filter((unit) =>
    unit.unitName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3Units = unitRanking.slice(0, 3);

  // Filter challenges based on selected filter
  const filteredChallenges = challenges.filter((c) => {
    const now = new Date();
    const endDate = new Date(c.endDate);
    const isActive = !c.isArchived && endDate >= now;
    const isExpired = !c.isArchived && endDate < now;
    const isArchived = c.isArchived === true;

    switch (activeChallengeFilter) {
      case 'actifs':
        return isActive;
      case 'expirés':
        return isExpired;
      case 'archivés':
        return isArchived;
      default:
        return true;
    }
  });

  // ==================== RENDER DASHBOARD ====================
  const renderDashboard = () => (
    <View style={styles.section}>
      {/* Global Stats - Clickable cards */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.primary}10` }]}
          onPress={() => setActiveTab('unites')}
          activeOpacity={0.7}
        >
          <View style={styles.statCardHeader}>
            <Text style={styles.statIcon}>🏕️</Text>
            <Text style={styles.statLabel}>Unités</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {globalStats?.totalUnits || 0}
          </Text>
          <Text style={styles.statTrend}>Voir toutes →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.blue}10` }]}
          onPress={() => setActiveTab('unites')}
          activeOpacity={0.7}
        >
          <View style={styles.statCardHeader}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statLabel}>Scouts</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.blue }]}>
            {globalStats?.totalScouts || 0}
          </Text>
          <Text style={styles.statTrend}>Voir par unité →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.accent}10` }]}
          onPress={() => setActiveTab('defis')}
          activeOpacity={0.7}
        >
          <View style={styles.statCardHeader}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statLabel}>Défis actifs</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {challenges.length}
          </Text>
          <Text style={styles.statTrend}>Gérer les défis →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.success}10` }]}
          onPress={() => setActiveTab('classement')}
          activeOpacity={0.7}
        >
          <View style={styles.statCardHeader}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statLabel}>Complétés</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {globalStats?.totalChallengesCompleted || 0}
          </Text>
          <Text style={styles.statTrend}>Voir classement →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(wecamp)/create-challenge')}
        >
          <Text style={styles.primaryButtonIcon}>🎯</Text>
          <Text style={styles.primaryButtonText}>Nouveau défi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleExportStats}>
          <Text style={styles.secondaryButtonIcon}>📊</Text>
          <Text style={styles.secondaryButtonText}>Exporter</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Activité des défis</Text>
      <View style={styles.activityCard}>
        {challengeStats.length === 0 ? (
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>📭</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Aucune activité</Text>
              <Text style={styles.activityTime}>Créez des défis pour commencer</Text>
            </View>
          </View>
        ) : (
          challengeStats.slice(0, 4).map((stat, index) => (
            <TouchableOpacity
              key={stat.challengeId}
              style={[
                styles.activityItem,
                index < Math.min(challengeStats.length, 4) - 1 && styles.activityItemBorder,
              ]}
              onPress={() => setActiveTab('defis')}
              activeOpacity={0.7}
            >
              <Text style={styles.activityIcon}>{stat.emoji}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{stat.title}</Text>
                <Text style={styles.activityTime}>
                  {stat.totalParticipants} participants · {stat.completed} complétés
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.neutral} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  // ==================== RENDER DEFIS ====================
  const renderDefis = () => (
    <View style={styles.section}>
      {/* Create Button */}
      <TouchableOpacity
        style={styles.createChallengeButton}
        onPress={() => router.push('/(wecamp)/create-challenge')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createChallengeButtonText}>Créer un défi global</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.defisStatsRow}>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.primary }]}>
            {challenges.filter((c) => !c.isArchived && new Date(c.endDate) >= new Date()).length}
          </Text>
          <Text style={styles.defisStatLabel}>Actifs</Text>
        </View>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.warning }]}>
            {challenges.filter((c) => !c.isArchived && new Date(c.endDate) < new Date()).length}
          </Text>
          <Text style={styles.defisStatLabel}>Expirés</Text>
        </View>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.neutral }]}>
            {challenges.filter((c) => c.isArchived).length}
          </Text>
          <Text style={styles.defisStatLabel}>Archivés</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {['tous', 'actifs', 'expirés', 'archivés'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeChallengeFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setActiveChallengeFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeChallengeFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Challenges List */}
      {filteredChallenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color={colors.neutral} />
          <Text style={styles.emptyStateText}>
            {activeChallengeFilter === 'tous' ? 'Aucun défi créé' : `Aucun défi ${activeChallengeFilter}`}
          </Text>
        </View>
      ) : (
        filteredChallenges.map((challenge) => {
          const stats = challengeStats.find((s) => s.challengeId === challenge.id);
          const diffStyle = getDifficultyStyle(challenge.difficulty);

          return (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeIconContainer}>
                  <Text style={styles.challengeIcon}>{challenge.emoji || '🎯'}</Text>
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle} numberOfLines={1}>
                    {challenge.title}
                  </Text>
                  <View style={styles.challengeTags}>
                    <View style={[styles.difficultyTag, { backgroundColor: diffStyle.bg }]}>
                      <Text style={[styles.difficultyTagText, { color: diffStyle.color }]}>
                        {diffStyle.label}
                      </Text>
                    </View>
                    <Text style={styles.pointsText}>+{challenge.points} pts</Text>
                  </View>
                </View>
              </View>

              {/* Challenge Stats */}
              <View style={styles.challengeStats}>
                <View style={styles.challengeStatItem}>
                  <Text style={[styles.challengeStatValue, { color: colors.primary }]}>
                    {unitRanking.length}
                  </Text>
                  <Text style={styles.challengeStatLabel}>unités</Text>
                </View>
                <View style={styles.challengeStatItem}>
                  <Text style={[styles.challengeStatValue, { color: colors.blue }]}>
                    {stats?.totalParticipants || 0}
                  </Text>
                  <Text style={styles.challengeStatLabel}>participants</Text>
                </View>
                <View style={styles.challengeStatItem}>
                  <Text style={[styles.challengeStatValue, { color: colors.success }]}>
                    {stats?.completed || 0}
                  </Text>
                  <Text style={styles.challengeStatLabel}>complétés</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.challengeActions}>
                <TouchableOpacity
                  style={styles.editChallengeButton}
                  onPress={() => router.push(`/(wecamp)/edit-challenge?id=${challenge.id}`)}
                >
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                  <Text style={styles.editChallengeText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteChallengeButton}
                  onPress={() => handleDeleteChallenge(challenge)}
                  disabled={deletingId === challenge.id}
                >
                  {deletingId === challenge.id ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      <Text style={styles.deleteChallengeText}>Supprimer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // ==================== RENDER UNITES ====================
  const renderUnites = () => (
    <View style={styles.section}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.neutral} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une unité..."
          placeholderTextColor={colors.neutralLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats */}
      <View style={styles.unitesStatsRow}>
        <View style={styles.unitesStatItem}>
          <Text style={[styles.unitesStatValue, { color: colors.success }]}>
            {unitRanking.filter((u) => u.totalMembers > 0).length}
          </Text>
          <Text style={styles.unitesStatLabel}>Actives</Text>
        </View>
        <View style={styles.unitesStatItem}>
          <Text style={[styles.unitesStatValue, { color: colors.warning }]}>
            0
          </Text>
          <Text style={styles.unitesStatLabel}>En alerte</Text>
        </View>
        <View style={styles.unitesStatItem}>
          <Text style={[styles.unitesStatValue, { color: colors.danger }]}>
            {unitRanking.filter((u) => u.totalMembers === 0).length}
          </Text>
          <Text style={styles.unitesStatLabel}>Inactives</Text>
        </View>
      </View>

      {/* Units List */}
      {filteredUnits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flag-outline" size={48} color={colors.neutral} />
          <Text style={styles.emptyStateText}>Aucune unité trouvée</Text>
        </View>
      ) : (
        filteredUnits.map((unit) => {
          const level = getUnitLevel(unit.totalPoints);
          const levelColor = getLevelColor(level);
          const isActive = unit.totalMembers > 0;

          return (
            <View
              key={unit.unitId}
              style={[
                styles.unitCard,
                { borderLeftColor: isActive ? colors.success : colors.danger },
              ]}
            >
              <View style={styles.unitHeader}>
                <View style={styles.unitInfo}>
                  <View style={styles.unitTitleRow}>
                    <Text style={styles.unitName} numberOfLines={1}>
                      {unit.unitName}
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: `${levelColor}30` }]}>
                      <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                        {level}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.unitCategory}>
                    {unit.category} · Récemment active
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewUnitButton} onPress={() => handleViewUnit(unit)}>
                  <Text style={styles.viewUnitButtonText}>Voir</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.unitStats}>
                <View style={styles.unitStatItem}>
                  <Text style={styles.unitStatEmoji}>👥</Text>
                  <Text style={styles.unitStatValue}>{unit.totalScouts}</Text>
                  <Text style={styles.unitStatLabel}>scouts</Text>
                </View>
                <View style={styles.unitStatItem}>
                  <Text style={styles.unitStatEmoji}>🎖️</Text>
                  <Text style={styles.unitStatValue}>{unit.totalAnimators}</Text>
                  <Text style={styles.unitStatLabel}>anim.</Text>
                </View>
                <View style={styles.unitStatItem}>
                  <Text style={styles.unitStatEmoji}>⭐</Text>
                  <Text style={[styles.unitStatValue, { color: colors.accent }]}>
                    {unit.totalPoints.toLocaleString()}
                  </Text>
                  <Text style={styles.unitStatLabel}>pts</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // ==================== RENDER CLASSEMENT ====================
  const renderClassement = () => (
    <View style={styles.section}>
      {/* Period Filter */}
      <View style={styles.periodFilter}>
        {[
          { key: 'week', label: 'Semaine' },
          { key: 'month', label: 'Mois' },
          { key: 'year', label: 'Année' },
          { key: 'all', label: 'Tout' },
        ].map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[styles.periodButton, rankingPeriod === period.key && styles.periodButtonActive]}
            onPress={() => setRankingPeriod(period.key as typeof rankingPeriod)}
          >
            <Text style={[styles.periodButtonText, rankingPeriod === period.key && styles.periodButtonTextActive]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {rankingPeriod !== 'all' && (
        <Text style={{ fontSize: 12, color: colors.neutral, textAlign: 'center', marginBottom: spacing.sm }}>
          Affichage: classement global (filtres bientôt disponibles)
        </Text>
      )}

      {/* Podium */}
      {top3Units.length >= 3 && top3Units.some((u) => u.totalPoints > 0) && (
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.podiumContainer}
        >
          {/* 2nd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumMedal, styles.podiumMedalSilver]}>
              <Text style={styles.podiumMedalEmoji}>🥈</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3Units[1]?.unitName || '-'}
            </Text>
            <Text style={styles.podiumPoints}>
              {(top3Units[1]?.totalPoints || 0).toLocaleString()} pts
            </Text>
            <View style={[styles.podiumBar, styles.podiumBarSilver]} />
          </View>

          {/* 1st Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumMedal, styles.podiumMedalGold]}>
              <Text style={styles.podiumMedalEmoji}>🥇</Text>
            </View>
            <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
              {top3Units[0]?.unitName || '-'}
            </Text>
            <Text style={[styles.podiumPoints, styles.podiumPointsFirst]}>
              {(top3Units[0]?.totalPoints || 0).toLocaleString()} pts
            </Text>
            <View style={[styles.podiumBar, styles.podiumBarGold]} />
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumMedal, styles.podiumMedalBronze]}>
              <Text style={styles.podiumMedalEmoji}>🥉</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3Units[2]?.unitName || '-'}
            </Text>
            <Text style={styles.podiumPoints}>
              {(top3Units[2]?.totalPoints || 0).toLocaleString()} pts
            </Text>
            <View style={[styles.podiumBar, styles.podiumBarBronze]} />
          </View>
        </LinearGradient>
      )}

      {/* Full Leaderboard */}
      <View style={styles.leaderboardCard}>
        {unitRanking.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="podium-outline" size={48} color={colors.neutral} />
            <Text style={styles.emptyStateText}>Aucune unité</Text>
          </View>
        ) : (
          unitRanking.map((unit, index) => {
            const isTop3 = index < 3 && unit.totalPoints > 0;
            const badges = ['🥇', '🥈', '🥉'];
            const bgColors = [`${colors.gold}15`, `${colors.silver}15`, `${colors.bronze}15`];

            return (
              <View
                key={unit.unitId}
                style={[
                  styles.leaderboardItem,
                  index < unitRanking.length - 1 && styles.leaderboardItemBorder,
                  isTop3 && { backgroundColor: bgColors[index] },
                ]}
              >
                <View style={styles.leaderboardRank}>
                  {isTop3 ? (
                    <Text style={styles.leaderboardBadge}>{badges[index]}</Text>
                  ) : (
                    <Text style={styles.leaderboardNumber}>#{index + 1}</Text>
                  )}
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>{unit.unitName}</Text>
                  <Text style={styles.leaderboardCategory}>
                    {unit.category} · {unit.totalMembers} membres
                  </Text>
                </View>
                <View style={styles.leaderboardPoints}>
                  <Text style={styles.leaderboardPointsValue}>
                    {unit.totalPoints.toLocaleString()} pts
                  </Text>
                  {unit.totalChallengesCompleted > 0 && (
                    <Text style={styles.leaderboardTrend}>
                      +{unit.totalChallengesCompleted} défis
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  // ==================== RENDER PARTENAIRES ====================
  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(partnerSearchQuery.toLowerCase())
  );

  const filteredOffers = allOffers.filter((o) =>
    o.title.toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    o.partner.name.toLowerCase().includes(partnerSearchQuery.toLowerCase())
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      alimentation: 'Alimentation',
      sport: 'Sport',
      outdoor: 'Outdoor',
      bricolage: 'Bricolage',
      culture: 'Culture',
      autre: 'Autre',
    };
    return labels[category] || category;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      alimentation: '🛒',
      sport: '⚽',
      outdoor: '🏕️',
      bricolage: '🔨',
      culture: '🎭',
      autre: '📦',
    };
    return emojis[category] || '📦';
  };

  const handleSeedPartners = async () => {
    Alert.alert(
      'Initialiser partenaires test',
      'Cela va créer 4 partenaires et leurs offres de test. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer',
          onPress: async () => {
            await PartnerService.seedTestPartners();
            await loadData();
            Alert.alert('Succès', 'Partenaires de test créés !');
          },
        },
      ]
    );
  };

  // Upload logo partenaire
  const pickPartnerLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPartnerLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection logo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadPartnerLogo = async (uri: string) => {
    try {
      setIsUploadingLogo(true);
      const logoUrl = await StorageService.uploadPartnerLogo(uri, `partner_${Date.now()}`);
      setPartnerForm({ ...partnerForm, logo: logoUrl });
    } catch (error) {
      console.error('Erreur upload logo:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader le logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removePartnerLogo = () => {
    setPartnerForm({ ...partnerForm, logo: '' });
  };

  const resetPartnerForm = () => {
    setPartnerForm({
      name: '',
      logo: '',
      category: 'alimentation' as Partner['category'],
      description: '',
      website: '',
    });
    setEditingPartner(null);
  };

  const handleSavePartner = async () => {
    // Validation
    if (!partnerForm.name.trim()) {
      Alert.alert('Erreur', 'Le nom du partenaire est requis');
      return;
    }
    if (!partnerForm.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return;
    }

    try {
      if (editingPartner) {
        // Mise à jour
        await PartnerService.updatePartner(editingPartner.id, {
          name: partnerForm.name.trim(),
          logo: partnerForm.logo,
          category: partnerForm.category,
          description: partnerForm.description.trim(),
          website: partnerForm.website.trim(),
        });
        // Mettre à jour la liste locale
        setPartners(partners.map(p =>
          p.id === editingPartner.id
            ? { ...p, ...partnerForm, name: partnerForm.name.trim(), description: partnerForm.description.trim(), website: partnerForm.website.trim() }
            : p
        ));
        Alert.alert('Succès', 'Partenaire modifié avec succès');
      } else {
        // Création
        const newPartner = await PartnerService.createPartner({
          name: partnerForm.name.trim(),
          logo: partnerForm.logo,
          category: partnerForm.category,
          description: partnerForm.description.trim(),
          website: partnerForm.website.trim(),
        });
        setPartners([...partners, newPartner]);
        Alert.alert('Succès', 'Partenaire créé avec succès');
      }

      setShowPartnerForm(false);
      resetPartnerForm();
    } catch (error) {
      console.error('Erreur sauvegarde partenaire:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le partenaire');
    }
  };

  const renderPartenaires = () => (
    <View style={styles.section}>
      {/* Sub-tabs */}
      <View style={styles.partnerSubTabs}>
        <TouchableOpacity
          style={[
            styles.partnerSubTab,
            activePartnerTab === 'partenaires' && styles.partnerSubTabActive,
          ]}
          onPress={() => setActivePartnerTab('partenaires')}
        >
          <Text
            style={[
              styles.partnerSubTabText,
              activePartnerTab === 'partenaires' && styles.partnerSubTabTextActive,
            ]}
          >
            Partenaires ({partners.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.partnerSubTab,
            activePartnerTab === 'offres' && styles.partnerSubTabActive,
          ]}
          onPress={() => setActivePartnerTab('offres')}
        >
          <Text
            style={[
              styles.partnerSubTabText,
              activePartnerTab === 'offres' && styles.partnerSubTabTextActive,
            ]}
          >
            Offres ({allOffers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.neutral} />
        <TextInput
          style={styles.searchInput}
          placeholder={activePartnerTab === 'partenaires' ? 'Rechercher un partenaire...' : 'Rechercher une offre...'}
          placeholderTextColor={colors.neutralLight}
          value={partnerSearchQuery}
          onChangeText={setPartnerSearchQuery}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.defisStatsRow}>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.primary }]}>
            {partners.length}
          </Text>
          <Text style={styles.defisStatLabel}>Partenaires</Text>
        </View>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.accent }]}>
            {allOffers.length}
          </Text>
          <Text style={styles.defisStatLabel}>Offres actives</Text>
        </View>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.success }]}>
            0
          </Text>
          <Text style={styles.defisStatLabel}>Échanges</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.quickActionsRow}>
        {activePartnerTab === 'partenaires' ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              resetPartnerForm();
              setShowPartnerForm(true);
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nouveau partenaire</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              resetOfferForm();
              setShowOfferForm(true);
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nouvelle offre</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSeedPartners}>
          <Text style={styles.secondaryButtonIcon}>🧪</Text>
          <Text style={styles.secondaryButtonText}>Test data</Text>
        </TouchableOpacity>
      </View>

      {/* Partner Form Modal */}
      {showPartnerForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingPartner ? 'Modifier partenaire' : 'Nouveau partenaire'}
            </Text>
            <TouchableOpacity onPress={() => setShowPartnerForm(false)}>
              <Ionicons name="close" size={24} color={colors.neutral} />
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Nom</Text>
            <TextInput
              style={styles.formInput}
              value={partnerForm.name}
              onChangeText={(text) => setPartnerForm({ ...partnerForm, name: text })}
              placeholder="Ex: Décathlon"
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Logo de l'entreprise</Text>
            {partnerForm.logo ? (
              <View style={styles.logoPreviewContainer}>
                <Image
                  source={{ uri: partnerForm.logo }}
                  style={styles.logoPreview}
                  contentFit="contain"
                />
                <TouchableOpacity
                  style={styles.removeLogoButton}
                  onPress={removePartnerLogo}
                >
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.logoPickerButton}
                onPress={pickPartnerLogo}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={32} color={colors.neutral} />
                    <Text style={styles.logoPickerText}>Cliquez pour uploader</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryChips}>
                {['alimentation', 'sport', 'outdoor', 'bricolage', 'culture', 'autre'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      partnerForm.category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setPartnerForm({ ...partnerForm, category: cat as Partner['category'] })}
                  >
                    <Text style={styles.categoryChipEmoji}>{getCategoryEmoji(cat)}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        partnerForm.category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
              value={partnerForm.description}
              onChangeText={(text) => setPartnerForm({ ...partnerForm, description: text })}
              placeholder="Description du partenaire..."
              multiline
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Site web (optionnel)</Text>
            <TextInput
              style={styles.formInput}
              value={partnerForm.website}
              onChangeText={(text) => setPartnerForm({ ...partnerForm, website: text })}
              placeholder="https://..."
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: spacing.md }]}
            onPress={handleSavePartner}
          >
            <Text style={styles.primaryButtonText}>
              {editingPartner ? 'Enregistrer' : 'Créer le partenaire'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Offer Form Modal */}
      {showOfferForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingOffer ? 'Modifier offre' : 'Nouvelle offre'}
            </Text>
            <TouchableOpacity onPress={() => setShowOfferForm(false)}>
              <Ionicons name="close" size={24} color={colors.neutral} />
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Partenaire</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryChips}>
                {partners.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.categoryChip,
                      offerForm.partnerId === p.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setOfferForm({ ...offerForm, partnerId: p.id })}
                  >
                    {p.logo?.startsWith('http') ? (
                      <Image source={{ uri: p.logo }} style={styles.offerFormPartnerLogo} />
                    ) : (
                      <Text style={styles.categoryChipEmoji}>{p.logo}</Text>
                    )}
                    <Text
                      style={[
                        styles.categoryChipText,
                        offerForm.partnerId === p.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Titre de l'offre</Text>
            <TextInput
              style={styles.formInput}
              value={offerForm.title}
              onChangeText={(text) => setOfferForm({ ...offerForm, title: text })}
              placeholder="Ex: 10% sur tout le magasin"
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
              value={offerForm.description}
              onChangeText={(text) => setOfferForm({ ...offerForm, description: text })}
              placeholder="Décrivez les conditions de l'offre..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Type de réduction</Text>
            <View style={styles.discountTypeRow}>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  offerForm.discountType === 'percentage' && styles.discountTypeButtonActive,
                ]}
                onPress={() => setOfferForm({ ...offerForm, discountType: 'percentage' })}
              >
                <Text
                  style={[
                    styles.discountTypeText,
                    offerForm.discountType === 'percentage' && styles.discountTypeTextActive,
                  ]}
                >
                  Pourcentage (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  offerForm.discountType === 'fixed' && styles.discountTypeButtonActive,
                ]}
                onPress={() => setOfferForm({ ...offerForm, discountType: 'fixed' })}
              >
                <Text
                  style={[
                    styles.discountTypeText,
                    offerForm.discountType === 'fixed' && styles.discountTypeTextActive,
                  ]}
                >
                  Montant fixe (€)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Valeur</Text>
              <TextInput
                style={styles.formInput}
                value={offerForm.discountValue}
                onChangeText={(text) => setOfferForm({ ...offerForm, discountValue: text })}
                placeholder={offerForm.discountType === 'percentage' ? '10' : '20'}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Coût (points)</Text>
              <TextInput
                style={styles.formInput}
                value={offerForm.pointsCost}
                onChangeText={(text) => setOfferForm({ ...offerForm, pointsCost: text })}
                placeholder="500"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Validité (jours)</Text>
              <TextInput
                style={styles.formInput}
                value={offerForm.validityDays}
                onChangeText={(text) => setOfferForm({ ...offerForm, validityDays: text })}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Max échanges</Text>
              <TextInput
                style={styles.formInput}
                value={offerForm.maxRedemptions}
                onChangeText={(text) => setOfferForm({ ...offerForm, maxRedemptions: text })}
                placeholder="Illimité"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: spacing.md }, savingOffer && { opacity: 0.7 }]}
            onPress={handleSaveOffer}
            disabled={savingOffer}
          >
            {savingOffer ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {editingOffer ? 'Enregistrer' : 'Créer l\'offre'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Partners List */}
      {activePartnerTab === 'partenaires' && (
        <>
          {filteredPartners.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={colors.neutral} />
              <Text style={styles.emptyStateText}>Aucun partenaire</Text>
              <Text style={[styles.emptyStateText, { fontSize: 12 }]}>
                Cliquez sur "Test data" pour créer des partenaires de démo
              </Text>
            </View>
          ) : (
            filteredPartners.map((partner) => {
              const partnerOffers = allOffers.filter((o) => o.partnerId === partner.id);

              return (
                <View key={partner.id} style={styles.partnerCard}>
                  <View style={styles.partnerHeader}>
                    <View style={styles.partnerLogoContainer}>
                      {partner.logo && partner.logo.startsWith('http') ? (
                        <Image
                          source={{ uri: partner.logo }}
                          style={styles.partnerLogoImage}
                          contentFit="contain"
                        />
                      ) : (
                        <Text style={styles.partnerLogo}>{partner.logo || '🏪'}</Text>
                      )}
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>{partner.name}</Text>
                      <View style={styles.partnerMeta}>
                        <View style={[styles.categoryTag, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[styles.categoryTagText, { color: colors.primary }]}>
                            {getCategoryEmoji(partner.category)} {getCategoryLabel(partner.category)}
                          </Text>
                        </View>
                        <Text style={styles.partnerOfferCount}>
                          {partnerOffers.length} offre{partnerOffers.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.partnerEditButton}
                      onPress={() => handlePartnerMenu(partner)}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={colors.neutral} />
                    </TouchableOpacity>
                  </View>
                  {partner.description && (
                    <Text style={styles.partnerDescription} numberOfLines={2}>
                      {partner.description}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      {/* Offers List */}
      {activePartnerTab === 'offres' && (
        <>
          {filteredOffers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={48} color={colors.neutral} />
              <Text style={styles.emptyStateText}>Aucune offre</Text>
            </View>
          ) : (
            filteredOffers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <View style={styles.offerPartnerBadge}>
                    {offer.partner.logo?.startsWith('http') ? (
                      <Image
                        source={{ uri: offer.partner.logo }}
                        style={styles.offerPartnerLogoImage}
                        contentFit="contain"
                      />
                    ) : (
                      <Text style={styles.offerPartnerLogo}>{offer.partner.logo || '🏪'}</Text>
                    )}
                    <Text style={styles.offerPartnerName}>{offer.partner.name}</Text>
                  </View>
                  <View style={styles.offerHeaderRight}>
                    <View style={[styles.offerDiscount, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.offerDiscountText, { color: colors.accent }]}>
                        -{offer.discountValue}{offer.discountType === 'percentage' ? '%' : '€'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.offerMenuButton}
                      onPress={() => handleOfferMenu(offer)}
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.neutral} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                {offer.description && (
                  <Text style={styles.offerDescription} numberOfLines={2}>{offer.description}</Text>
                )}
                <View style={styles.offerMeta}>
                  <View style={styles.offerMetaItem}>
                    <Ionicons name="star" size={14} color={colors.accent} />
                    <Text style={styles.offerMetaText}>{offer.pointsCost} pts</Text>
                  </View>
                  <View style={styles.offerMetaItem}>
                    <Ionicons name="time" size={14} color={colors.neutral} />
                    <Text style={styles.offerMetaText}>{offer.validityDays} jours</Text>
                  </View>
                  <View style={styles.offerMetaItem}>
                    <Ionicons name="swap-horizontal" size={14} color={colors.neutral} />
                    <Text style={styles.offerMetaText}>
                      {offer.currentRedemptions}{offer.maxRedemptions ? `/${offer.maxRedemptions}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </View>
  );

  // === BADGES ===

  const resetBadgeForm = () => {
    setBadgeForm({
      name: '',
      description: '',
      icon: '',
      category: BadgeCategory.NATURE,
      conditionType: 'manual',
      conditionValue: '',
      conditionCategory: '',
    });
    setEditingBadge(null);
  };

  const handleEditBadge = (badge: BadgeDefinition) => {
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      conditionType: badge.condition.type,
      conditionValue: badge.condition.value?.toString() || '',
      conditionCategory: badge.condition.challengeCategory || '',
    });
    setEditingBadge(badge);
    setShowBadgeForm(true);
    setSelectedBadgeForMenu(null);
  };

  const handleDeleteBadge = async (badge: BadgeDefinition) => {
    Alert.alert(
      'Supprimer le badge',
      `Êtes-vous sûr de vouloir supprimer définitivement "${badge.name}" ? Les badges déjà attribués aux scouts seront conservés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await BadgeService.hardDeleteBadge(badge.id);
              setBadges(badges.filter(b => b.id !== badge.id));
              Alert.alert('Succès', 'Badge supprimé définitivement');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le badge');
            }
          },
        },
      ]
    );
    setSelectedBadgeForMenu(null);
  };

  const handleDeleteAllBadges = async () => {
    Alert.alert(
      'Supprimer tous les badges',
      `Êtes-vous sûr de vouloir supprimer définitivement les ${badges.length} badges ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const count = await BadgeService.deleteAllBadges();
              setBadges([]);
              Alert.alert('Succès', `${count} badges supprimés`);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer les badges');
            }
          },
        },
      ]
    );
  };

  const handleSaveBadge = async () => {
    if (!badgeForm.name.trim() || !badgeForm.icon.trim()) {
      Alert.alert('Erreur', 'Le nom et l\'icône sont obligatoires');
      return;
    }

    // Construire la condition
    const condition: BadgeCondition = {
      type: badgeForm.conditionType,
    };

    if (badgeForm.conditionType !== 'manual') {
      const value = parseInt(badgeForm.conditionValue);
      if (isNaN(value) || value <= 0) {
        Alert.alert('Erreur', 'La valeur de la condition doit être un nombre positif');
        return;
      }
      condition.value = value;
    }

    if (badgeForm.conditionType === 'challenges_category' && !badgeForm.conditionCategory) {
      Alert.alert('Erreur', 'La catégorie de défis est obligatoire pour ce type de condition');
      return;
    }

    if (badgeForm.conditionType === 'challenges_category') {
      condition.challengeCategory = badgeForm.conditionCategory;
    }

    try {
      if (editingBadge) {
        await BadgeService.updateBadge(editingBadge.id, {
          name: badgeForm.name.trim(),
          description: badgeForm.description.trim(),
          icon: badgeForm.icon.trim(),
          category: badgeForm.category,
          condition,
        });
        setBadges(badges.map(b =>
          b.id === editingBadge.id
            ? { ...b, name: badgeForm.name.trim(), description: badgeForm.description.trim(), icon: badgeForm.icon.trim(), category: badgeForm.category, condition }
            : b
        ));
        Alert.alert('Succès', 'Badge modifié');
      } else {
        const newBadge = await BadgeService.createBadge({
          name: badgeForm.name.trim(),
          description: badgeForm.description.trim(),
          icon: badgeForm.icon.trim(),
          category: badgeForm.category,
          condition,
        });
        setBadges([...badges, newBadge]);
        Alert.alert('Succès', 'Badge créé');
      }
      setShowBadgeForm(false);
      resetBadgeForm();
    } catch (error) {
      console.error('Erreur sauvegarde badge:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le badge');
    }
  };

  const getBadgeCategoryLabel = (category: BadgeCategory) => {
    const labels: Record<BadgeCategory, string> = {
      [BadgeCategory.NATURE]: 'Nature',
      [BadgeCategory.CUISINE]: 'Cuisine',
      [BadgeCategory.SPORT]: 'Sport',
      [BadgeCategory.PREMIERS_SECOURS]: 'Premiers secours',
      [BadgeCategory.CREATIVITE]: 'Créativité',
      [BadgeCategory.SOCIAL]: 'Social',
      [BadgeCategory.TECHNIQUE]: 'Technique',
    };
    return labels[category] || category;
  };

  const filteredBadges = badges.filter(badge =>
    badge.name.toLowerCase().includes(badgeSearchQuery.toLowerCase()) ||
    badge.description.toLowerCase().includes(badgeSearchQuery.toLowerCase())
  );

  const renderBadges = () => (
    <View style={styles.section}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.neutral} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un badge..."
          placeholderTextColor={colors.neutralLight}
          value={badgeSearchQuery}
          onChangeText={setBadgeSearchQuery}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.defisStatsRow}>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.primary }]}>
            {badges.filter(b => b.isActive).length}
          </Text>
          <Text style={styles.defisStatLabel}>Badges actifs</Text>
        </View>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.accent }]}>
            {totalBadgesAwarded}
          </Text>
          <Text style={styles.defisStatLabel}>Attribués</Text>
        </View>
        <View style={styles.defisStatItem}>
          <Text style={[styles.defisStatValue, { color: colors.neutral }]}>
            {badges.filter(b => !b.isActive).length}
          </Text>
          <Text style={styles.defisStatLabel}>Inactifs</Text>
        </View>
      </View>

      {/* Create Badge Card */}
      <TouchableOpacity
        style={styles.createBadgeCard}
        onPress={() => {
          resetBadgeForm();
          setShowBadgeForm(true);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.createBadgeIconContainer}>
          <View style={styles.createBadgeIcon}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </View>
        </View>
        <View style={styles.createBadgeContent}>
          <Text style={styles.createBadgeTitle}>Créer un badge</Text>
          <Text style={styles.createBadgeSubtitle}>
            Définissez les conditions et récompensez vos scouts
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
      </TouchableOpacity>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ribbon-outline" size={48} color={colors.neutral} />
          <Text style={styles.emptyStateText}>Aucun badge</Text>
          <Text style={styles.emptyStateSubtext}>Créez votre premier badge</Text>
        </View>
      ) : (
        <View style={styles.badgesGridContainer}>
          {filteredBadges.map((badge) => {
            const categoryColor = {
              [BadgeCategory.NATURE]: '#4CAF50',
              [BadgeCategory.CUISINE]: '#FF9800',
              [BadgeCategory.SPORT]: '#2196F3',
              [BadgeCategory.PREMIERS_SECOURS]: '#F44336',
              [BadgeCategory.CREATIVITE]: '#9C27B0',
              [BadgeCategory.SOCIAL]: '#E91E63',
              [BadgeCategory.TECHNIQUE]: '#607D8B',
            }[badge.category] || colors.primary;

            return (
              <TouchableOpacity
                key={badge.id}
                style={[styles.badgeGridCard, !badge.isActive && { opacity: 0.5 }]}
                onPress={() => setSelectedBadgeForMenu(badge)}
                activeOpacity={0.8}
              >
                {/* Active indicator */}
                <View style={[styles.badgeActiveIndicator, { backgroundColor: badge.isActive ? '#4CAF50' : colors.neutral }]} />

                {/* Icon circle */}
                <View style={[styles.badgeIconCircle, { borderColor: categoryColor }]}>
                  <View style={[styles.badgeIconInner, { backgroundColor: `${categoryColor}15` }]}>
                    <Text style={styles.badgeIconText}>{badge.icon}</Text>
                  </View>
                </View>

                {/* Badge name */}
                <Text style={styles.badgeGridName} numberOfLines={2}>{badge.name}</Text>

                {/* Category tag */}
                <View style={[styles.badgeCategoryTag, { backgroundColor: `${categoryColor}15` }]}>
                  <Text style={[styles.badgeCategoryTagText, { color: categoryColor }]}>
                    {getBadgeCategoryLabel(badge.category)}
                  </Text>
                </View>

                {/* Condition */}
                <Text style={styles.badgeGridCondition}>
                  {BadgeService.formatCondition(badge.condition)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>WeCamp Admin</Text>
            <Text style={styles.headerSubtitle}>Panneau d'administration</Text>
          </View>
          <TouchableOpacity onPress={() => setShowProfileMenu(true)} style={styles.avatarButton}>
            <Text style={styles.avatarText}>AD</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'defis' && renderDefis()}
            {activeTab === 'unites' && renderUnites()}
            {activeTab === 'classement' && renderClassement()}
            {activeTab === 'partenaires' && renderPartenaires()}
            {activeTab === 'badges' && renderBadges()}
          </>
        )}
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal
        visible={showUnitModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUnitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUnit && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedUnit.unitName}</Text>
                  <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                    <Ionicons name="close" size={24} color={colors.neutral} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.levelBadge, { backgroundColor: `${getLevelColor(getUnitLevel(selectedUnit.totalPoints))}30`, alignSelf: 'flex-start', marginBottom: spacing.md }]}>
                  <Text style={[styles.levelBadgeText, { color: getLevelColor(getUnitLevel(selectedUnit.totalPoints)) }]}>
                    Niveau {getUnitLevel(selectedUnit.totalPoints)}
                  </Text>
                </View>

                <Text style={styles.modalSubtitle}>{selectedUnit.category}</Text>

                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedUnit.totalScouts}</Text>
                    <Text style={styles.modalStatLabel}>Scouts</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedUnit.totalAnimators}</Text>
                    <Text style={styles.modalStatLabel}>Animateurs</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: colors.accent }]}>
                      {selectedUnit.totalPoints.toLocaleString()}
                    </Text>
                    <Text style={styles.modalStatLabel}>Points</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: colors.success }]}>
                      {selectedUnit.totalChallengesCompleted}
                    </Text>
                    <Text style={styles.modalStatLabel}>Défis complétés</Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="people" size={18} color={colors.neutral} />
                  <Text style={styles.modalInfoText}>
                    {selectedUnit.totalMembers} membres au total
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: spacing.lg }]}
                  onPress={() => {
                    setShowUnitModal(false);
                    setActiveTab('classement');
                  }}
                >
                  <Text style={styles.primaryButtonText}>Voir dans le classement</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Partner Context Menu Modal */}
      <Modal
        visible={!!selectedPartnerForMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPartnerForMenu(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPartnerForMenu(null)}
        >
          <View style={styles.menuContent}>
            {selectedPartnerForMenu && (
              <>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>{selectedPartnerForMenu.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleEditPartner}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleViewPartnerOffers}
                >
                  <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>Voir les offres</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDeletePartner}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuCancelItem]}
                  onPress={() => setSelectedPartnerForMenu(null)}
                >
                  <Text style={styles.menuCancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Offer Context Menu Modal */}
      <Modal
        visible={!!selectedOfferForMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedOfferForMenu(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setSelectedOfferForMenu(null)}
        >
          <View style={styles.menuContent}>
            {selectedOfferForMenu && (
              <>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>{selectedOfferForMenu.title}</Text>
                  <Text style={styles.menuSubtitle}>{selectedOfferForMenu.partner.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleEditOffer}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>Modifier</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDeleteOffer}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuCancelItem]}
                  onPress={() => setSelectedOfferForMenu(null)}
                >
                  <Text style={styles.menuCancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Badge Context Menu Modal */}
      <Modal
        visible={!!selectedBadgeForMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedBadgeForMenu(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadgeForMenu(null)}
        >
          <View style={styles.menuContent}>
            {selectedBadgeForMenu && (
              <>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuHeaderTitle}>{selectedBadgeForMenu.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleEditBadge(selectedBadgeForMenu)}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.neutral} />
                  <Text style={styles.menuItemText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDeleteBadge(selectedBadgeForMenu)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuCancelItem]}
                  onPress={() => setSelectedBadgeForMenu(null)}
                >
                  <Text style={styles.menuCancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Badge Form Modal */}
      <Modal
        visible={showBadgeForm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBadgeForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBadge ? 'Modifier le badge' : 'Nouveau badge'}
              </Text>
              <TouchableOpacity onPress={() => setShowBadgeForm(false)}>
                <Ionicons name="close" size={24} color={colors.neutral} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Icon */}
              <Text style={styles.formLabel}>Icône</Text>
              <View style={styles.emojiPickerContainer}>
                <View style={styles.selectedEmojiBox}>
                  <Text style={styles.selectedEmoji}>{badgeForm.icon || '?'}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScrollView}>
                  <View style={styles.emojiGrid}>
                    {[
                      // Trophées & Récompenses
                      '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🌟', '⭐', '✨', '💎',
                      // Nature & Outdoor
                      '🏕️', '⛺', '🔥', '🌲', '🌳', '🍃', '🌿', '🌻', '🦋', '🐦',
                      // Sport & Activités
                      '🎯', '🧗', '🚴', '🏃', '🤸', '⚽', '🏀', '🎾', '🥾', '🧭',
                      // Créativité & Arts
                      '🎨', '🎭', '🎵', '📸', '✏️', '🎪', '🎬', '🖌️', '🎹', '🎸',
                      // Cuisine & Social
                      '👨‍🍳', '🍳', '🥘', '🤝', '💪', '❤️', '🙌', '👏', '🎉', '🎊',
                      // Technique & Science
                      '🔧', '⚙️', '🛠️', '🔬', '🧪', '💡', '📡', '🔭', '🧲', '⚡',
                      // Animaux
                      '🦊', '🦁', '🐺', '🦅', '🦉', '🐻', '🦌', '🐿️', '🦎', '🐢',
                      // Premiers secours
                      '🏥', '💊', '🩹', '❤️‍🩹', '🚑', '⛑️', '🩺', '💉', '🧬', '🫀',
                    ].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.emojiOption,
                          badgeForm.icon === emoji && styles.emojiOptionSelected,
                        ]}
                        onPress={() => setBadgeForm({ ...badgeForm, icon: emoji })}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Name */}
              <Text style={styles.formLabel}>Nom</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nom du badge"
                placeholderTextColor={colors.neutralLight}
                value={badgeForm.name}
                onChangeText={(text) => setBadgeForm({ ...badgeForm, name: text })}
              />

              {/* Description */}
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Description du badge"
                placeholderTextColor={colors.neutralLight}
                value={badgeForm.description}
                onChangeText={(text) => setBadgeForm({ ...badgeForm, description: text })}
                multiline
              />

              {/* Category */}
              <Text style={styles.formLabel}>Catégorie</Text>
              <View style={styles.categoryGrid}>
                {Object.values(BadgeCategory).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      badgeForm.category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setBadgeForm({ ...badgeForm, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        badgeForm.category === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {getBadgeCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Condition Type */}
              <Text style={styles.formLabel}>Condition de déblocage</Text>
              <View style={styles.conditionTypeGrid}>
                {[
                  { type: 'manual', label: 'Manuel', icon: 'hand-left-outline' },
                  { type: 'points', label: 'Points XP', icon: 'star-outline' },
                  { type: 'challenges', label: 'Défis', icon: 'trophy-outline' },
                  { type: 'challenges_category', label: 'Défis catégorie', icon: 'layers-outline' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.conditionTypeOption,
                      badgeForm.conditionType === item.type && styles.conditionTypeOptionActive,
                    ]}
                    onPress={() => setBadgeForm({ ...badgeForm, conditionType: item.type as any })}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={badgeForm.conditionType === item.type ? '#FFFFFF' : colors.neutral}
                    />
                    <Text
                      style={[
                        styles.conditionTypeText,
                        badgeForm.conditionType === item.type && styles.conditionTypeTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Condition Value */}
              {badgeForm.conditionType !== 'manual' && (
                <>
                  <Text style={styles.formLabel}>
                    {badgeForm.conditionType === 'points' ? 'Points requis' : 'Nombre de défis requis'}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={badgeForm.conditionType === 'points' ? 'Ex: 500' : 'Ex: 5'}
                    placeholderTextColor={colors.neutralLight}
                    value={badgeForm.conditionValue}
                    onChangeText={(text) => setBadgeForm({ ...badgeForm, conditionValue: text })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {/* Challenge Category (if challenges_category) */}
              {badgeForm.conditionType === 'challenges_category' && (
                <>
                  <Text style={styles.formLabel}>Catégorie de défis</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex: nature, sport, cuisine"
                    placeholderTextColor={colors.neutralLight}
                    value={badgeForm.conditionCategory}
                    onChangeText={(text) => setBadgeForm({ ...badgeForm, conditionCategory: text })}
                  />
                </>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: spacing.lg, marginBottom: spacing.xl }]}
                onPress={handleSaveBadge}
              >
                <Text style={styles.primaryButtonText}>
                  {editingBadge ? 'Enregistrer' : 'Créer le badge'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.profileMenuContent}>
            <View style={styles.profileMenuHeader}>
              <View style={styles.profileMenuAvatar}>
                <Text style={styles.profileMenuAvatarText}>AD</Text>
              </View>
              <View>
                <Text style={styles.profileMenuName}>Administrateur</Text>
                <Text style={styles.profileMenuRole}>WeCamp Admin</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
                // TODO: Navigate to settings if needed
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.neutral} />
              <Text style={styles.menuItemText}>Paramètres</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setShowProfileMenu(false);
                await logout();
                router.replace('/(auth)/login');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>Se déconnecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuCancelItem]}
              onPress={() => setShowProfileMenu(false)}
            >
              <Text style={styles.menuCancelText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },

  // Header
  header: {
    backgroundColor: colors.canvas,
    paddingTop: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.neutral,
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    marginRight: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },

  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginTop: spacing.sm,
  },

  // Dashboard Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    color: colors.success,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonIcon: {
    fontSize: 16,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  secondaryButtonIcon: {
    fontSize: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Activity
  activityCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.mist,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.dark,
  },
  activityTime: {
    fontSize: 12,
    color: colors.neutralLight,
    marginTop: 2,
  },

  // Défis
  createChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  createChallengeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  defisStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  defisStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  defisStatValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  defisStatLabel: {
    fontSize: 11,
    color: colors.neutral,
    marginTop: 2,
  },
  filtersScroll: {
    marginVertical: spacing.xs,
  },
  filtersContent: {
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    marginRight: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.neutral,
  },
  challengeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
  },
  challengeTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  challengeStats: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
    gap: spacing.lg,
  },
  challengeStatItem: {
    alignItems: 'center',
  },
  challengeStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  challengeStatLabel: {
    fontSize: 11,
    color: colors.neutral,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editChallengeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
  },
  editChallengeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  deleteChallengeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: `${colors.danger}10`,
  },
  deleteChallengeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
  },

  // Confirm Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.danger}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
  },
  confirmModalMessage: {
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmModalWarning: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.mist,
    alignItems: 'center',
  },
  confirmModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  confirmModalDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmModalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Unités
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mist,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
  },
  unitesStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  unitesStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
  },
  unitesStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  unitesStatLabel: {
    fontSize: 10,
    color: colors.neutral,
  },
  unitCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
    borderLeftWidth: 4,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  unitInfo: {
    flex: 1,
  },
  unitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
  },
  unitCategory: {
    fontSize: 12,
    color: colors.neutral,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  viewUnitButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.mist,
  },
  viewUnitButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.dark,
  },
  unitStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  unitStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitStatEmoji: {
    fontSize: 13,
  },
  unitStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  unitStatLabel: {
    fontSize: 13,
    color: colors.neutral,
  },

  // Classement
  periodFilter: {
    flexDirection: 'row',
    backgroundColor: colors.mist,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderRadius: 20,
    padding: spacing.lg,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumMedal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumMedalGold: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3,
    borderColor: colors.gold,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  podiumMedalSilver: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  podiumMedalBronze: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  podiumMedalEmoji: {
    fontSize: 28,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: '700',
  },
  podiumPoints: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  podiumPointsFirst: {
    fontSize: 12,
  },
  podiumBar: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumBarGold: {
    height: 80,
    backgroundColor: colors.gold,
  },
  podiumBarSilver: {
    height: 60,
    backgroundColor: colors.silver,
  },
  podiumBarBronze: {
    height: 45,
    backgroundColor: colors.bronze,
  },
  leaderboardCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.mist,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  leaderboardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  leaderboardRank: {
    width: 32,
    alignItems: 'center',
  },
  leaderboardBadge: {
    fontSize: 20,
  },
  leaderboardNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
  },
  leaderboardCategory: {
    fontSize: 12,
    color: colors.neutral,
    marginTop: 2,
  },
  leaderboardPoints: {
    alignItems: 'flex-end',
  },
  leaderboardPointsValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  leaderboardTrend: {
    fontSize: 11,
    color: colors.success,
    marginTop: 2,
  },

  // Partenaires
  partnerSubTabs: {
    flexDirection: 'row',
    backgroundColor: colors.mist,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  partnerSubTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  partnerSubTabActive: {
    backgroundColor: colors.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  partnerSubTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral,
  },
  partnerSubTabTextActive: {
    color: colors.dark,
  },
  partnerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  partnerLogo: {
    fontSize: 24,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  partnerOfferCount: {
    fontSize: 12,
    color: colors.neutral,
  },
  partnerEditButton: {
    padding: spacing.md,
    marginRight: -spacing.sm,
  },
  partnerDescription: {
    fontSize: 13,
    color: colors.neutral,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  offerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  offerPartnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerPartnerLogo: {
    fontSize: 18,
  },
  offerPartnerLogoImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  offerPartnerName: {
    fontSize: 12,
    color: colors.neutral,
    fontWeight: '500',
  },
  offerDiscount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerDiscountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  offerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  offerMenuButton: {
    padding: 4,
  },
  challengeMenuButton: {
    padding: 4,
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  offerDescription: {
    fontSize: 13,
    color: colors.neutral,
    marginBottom: spacing.sm,
  },
  offerMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  offerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerMetaText: {
    fontSize: 12,
    color: colors.neutral,
  },

  // Form Styles
  formCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.mist,
    marginBottom: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  formRow: {
    marginBottom: spacing.md,
  },
  formRowInline: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.mist,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.dark,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.mist,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  offerFormPartnerLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  discountTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.mist,
    alignItems: 'center',
  },
  discountTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  discountTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral,
  },
  discountTypeTextActive: {
    color: '#FFFFFF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.neutral,
    marginBottom: spacing.lg,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.mist,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: colors.neutral,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mist,
    padding: spacing.md,
    borderRadius: 12,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.dark,
  },

  // Partner context menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.neutral,
    textAlign: 'center',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.dark,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.mist,
    marginHorizontal: spacing.lg,
  },
  menuCancelItem: {
    justifyContent: 'center',
    backgroundColor: colors.mist,
    marginTop: spacing.xs,
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral,
    textAlign: 'center',
  },

  // Profile menu styles
  profileMenuContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  profileMenuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMenuAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
  },
  profileMenuRole: {
    fontSize: 13,
    color: colors.neutral,
  },

  // Partner logo upload styles
  logoPickerButton: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutralLight,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logoPickerText: {
    fontSize: 11,
    color: colors.neutral,
    textAlign: 'center',
  },
  logoPreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.mist,
  },
  removeLogoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
  },
  partnerLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },

  // Badge styles
  badgeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeConditionText: {
    fontSize: 12,
    color: colors.neutral,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.mist,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 13,
    color: colors.neutral,
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  conditionTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  conditionTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.mist,
  },
  conditionTypeOptionActive: {
    backgroundColor: colors.primary,
  },
  conditionTypeText: {
    fontSize: 13,
    color: colors.neutral,
  },
  conditionTypeTextActive: {
    color: '#FFFFFF',
  },

  // Badge Grid
  badgesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeGridCard: {
    width: '47%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  badgeActiveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badgeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeIconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconText: {
    fontSize: 36,
  },
  badgeGridName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  badgeCategoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  badgeCategoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeGridCondition: {
    fontSize: 12,
    color: colors.neutral,
    textAlign: 'center',
  },

  // Emoji Picker
  emojiPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  selectedEmojiBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedEmoji: {
    fontSize: 32,
  },
  emojiScrollView: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emojiText: {
    fontSize: 22,
  },

  // Create Badge Card
  createBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  createBadgeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBadgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBadgeContent: {
    flex: 1,
  },
  createBadgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  createBadgeSubtitle: {
    fontSize: 13,
    color: colors.neutral,
    lineHeight: 18,
  },
});
