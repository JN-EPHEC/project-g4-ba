import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

const STATUS_BAR_HEIGHT = Platform.select({
  ios: Constants.statusBarHeight || 44,
  android: Constants.statusBarHeight || 24,
  web: 0,
  default: 0,
});

const PRIVACY_POLICY_VERSION = '1.0';
const LAST_UPDATED = '19 janvier 2025';

export default function PrivacyPolicyScreen() {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: cardColor, borderColor }]}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <ThemedText style={[styles.paragraph, { color: textSecondary }]}>{children}</ThemedText>
  );

  const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletContainer}>
      <ThemedText style={[styles.bullet, { color: BrandColors.primary[500] }]}>•</ThemedText>
      <ThemedText style={[styles.bulletText, { color: textSecondary }]}>{children}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Politique de confidentialite
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Version et date */}
        <View style={styles.versionContainer}>
          <ThemedText style={[styles.versionText, { color: textSecondary }]}>
            Version {PRIVACY_POLICY_VERSION} - Derniere mise a jour : {LAST_UPDATED}
          </ThemedText>
        </View>

        {/* Introduction */}
        <Section title="1. Responsable du traitement">
          <Paragraph>
            WeCamp est une application de gestion d'unites scoutes developpee dans le cadre
            d'un projet academique. L'application permet la gestion des membres, des activites
            et des communications au sein des unites scoutes.
          </Paragraph>
          <Paragraph>
            Pour toute question concernant vos donnees personnelles, vous pouvez nous contacter
            a l'adresse : contact@wecamp.app
          </Paragraph>
        </Section>

        <Section title="2. Donnees collectees">
          <ThemedText style={[styles.subsectionTitle, { color: textColor }]}>
            2.1 Donnees d'identification
          </ThemedText>
          <BulletPoint>Nom et prenom</BulletPoint>
          <BulletPoint>Adresse email</BulletPoint>
          <BulletPoint>Numero de telephone (optionnel)</BulletPoint>
          <BulletPoint>Date de naissance (pour les scouts)</BulletPoint>
          <BulletPoint>Photo de profil (optionnelle)</BulletPoint>

          <ThemedText style={[styles.subsectionTitle, { color: textColor, marginTop: 16 }]}>
            2.2 Donnees de sante (scouts uniquement)
          </ThemedText>
          <Paragraph>
            Ces donnees sont collectees uniquement pour assurer la securite des enfants
            lors des activites scoutes :
          </Paragraph>
          <BulletPoint>Groupe sanguin</BulletPoint>
          <BulletPoint>Allergies et leur severite</BulletPoint>
          <BulletPoint>Medicaments et traitements</BulletPoint>
          <BulletPoint>Contacts d'urgence</BulletPoint>
          <BulletPoint>Informations d'assurance</BulletPoint>

          <ThemedText style={[styles.subsectionTitle, { color: textColor, marginTop: 16 }]}>
            2.3 Donnees d'activite
          </ThemedText>
          <BulletPoint>Participation aux defis et evenements</BulletPoint>
          <BulletPoint>Messages et publications dans l'application</BulletPoint>
          <BulletPoint>Photos d'activites</BulletPoint>
          <BulletPoint>Points et progression</BulletPoint>
        </Section>

        <Section title="3. Finalites du traitement">
          <Paragraph>Vos donnees sont utilisees pour :</Paragraph>
          <BulletPoint>Gerer les membres et les unites scoutes</BulletPoint>
          <BulletPoint>Organiser les activites et evenements</BulletPoint>
          <BulletPoint>Permettre la communication entre membres</BulletPoint>
          <BulletPoint>Suivre la progression des scouts (defis, badges)</BulletPoint>
          <BulletPoint>Assurer la securite des mineurs (fiches sante)</BulletPoint>
          <BulletPoint>Gerer les relations parents-enfants</BulletPoint>
        </Section>

        <Section title="4. Base legale">
          <Paragraph>
            Le traitement de vos donnees repose sur :
          </Paragraph>
          <BulletPoint>
            Votre consentement explicite lors de l'inscription
          </BulletPoint>
          <BulletPoint>
            L'interet legitime pour assurer la securite des mineurs lors des activites
          </BulletPoint>
          <BulletPoint>
            L'execution du contrat de service entre vous et WeCamp
          </BulletPoint>
        </Section>

        <Section title="5. Duree de conservation">
          <Paragraph>
            Vos donnees sont conservees tant que votre compte est actif.
          </Paragraph>
          <Paragraph>
            Apres suppression de votre compte, toutes vos donnees personnelles sont
            definitivement effacees dans un delai maximum de 30 jours.
          </Paragraph>
          <Paragraph>
            Les donnees de sante des scouts sont automatiquement supprimees
            a la suppression du compte.
          </Paragraph>
        </Section>

        <Section title="6. Vos droits">
          <Paragraph>
            Conformement au Reglement General sur la Protection des Donnees (RGPD),
            vous disposez des droits suivants :
          </Paragraph>
          <BulletPoint>
            Droit d'acces : obtenir une copie de vos donnees personnelles
          </BulletPoint>
          <BulletPoint>
            Droit de rectification : corriger vos donnees inexactes
          </BulletPoint>
          <BulletPoint>
            Droit a l'effacement : supprimer votre compte et toutes vos donnees
          </BulletPoint>
          <BulletPoint>
            Droit a la portabilite : recevoir vos donnees dans un format structure
          </BulletPoint>
          <BulletPoint>
            Droit d'opposition : vous opposer a certains traitements
          </BulletPoint>
          <Paragraph>
            Pour exercer ces droits, utilisez les parametres de l'application ou
            contactez-nous a : contact@wecamp.app
          </Paragraph>
        </Section>

        <Section title="7. Mineurs">
          <View style={[styles.warningBox, { backgroundColor: `${BrandColors.accent[500]}15`, borderColor: BrandColors.accent[500] }]}>
            <Ionicons name="warning" size={20} color={BrandColors.accent[500]} />
            <ThemedText style={[styles.warningText, { color: BrandColors.accent[700] }]}>
              Dispositions speciales pour les utilisateurs mineurs
            </ThemedText>
          </View>
          <Paragraph>
            Pour les utilisateurs ages de moins de 16 ans (scouts), le consentement
            d'un parent ou tuteur legal est requis pour l'utilisation de l'application.
          </Paragraph>
          <Paragraph>
            Les parents ou tuteurs legaux peuvent a tout moment :
          </Paragraph>
          <BulletPoint>Acceder aux donnees de leur enfant</BulletPoint>
          <BulletPoint>Demander la modification des donnees</BulletPoint>
          <BulletPoint>Demander la suppression du compte de leur enfant</BulletPoint>
          <Paragraph>
            La liaison entre un compte parent et un compte scout se fait via un code
            securise genere par le scout.
          </Paragraph>
        </Section>

        <Section title="8. Securite des donnees">
          <Paragraph>
            Vos donnees sont stockees de maniere securisee sur les serveurs Firebase (Google)
            avec les mesures de protection suivantes :
          </Paragraph>
          <BulletPoint>Chiffrement des donnees en transit (HTTPS/TLS)</BulletPoint>
          <BulletPoint>Chiffrement des donnees au repos</BulletPoint>
          <BulletPoint>Authentification securisee</BulletPoint>
          <BulletPoint>Regles de securite strictes sur l'acces aux donnees</BulletPoint>
          <BulletPoint>Hebergement dans des datacenters certifies</BulletPoint>
        </Section>

        <Section title="9. Partage des donnees">
          <Paragraph>
            Vos donnees ne sont jamais vendues a des tiers.
          </Paragraph>
          <Paragraph>
            Les donnees peuvent etre partagees uniquement :
          </Paragraph>
          <BulletPoint>
            Avec les animateurs de votre unite (pour la gestion des activites)
          </BulletPoint>
          <BulletPoint>
            Avec les parents lies a un scout (pour le suivi de l'enfant)
          </BulletPoint>
          <BulletPoint>
            Avec nos prestataires techniques (Firebase/Google) pour l'hebergement
          </BulletPoint>
        </Section>

        <Section title="10. Modifications de la politique">
          <Paragraph>
            Cette politique de confidentialite peut etre mise a jour periodiquement.
            En cas de modification importante, vous serez informe via l'application.
          </Paragraph>
          <Paragraph>
            La poursuite de l'utilisation de l'application apres une mise a jour
            vaut acceptation des nouvelles conditions.
          </Paragraph>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            WeCamp - Application de gestion d'unites scoutes
          </ThemedText>
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            Version {PRIVACY_POLICY_VERSION}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  versionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: BrandColors.primary[600],
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
