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
          Politique de confidentialité
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
            Version {PRIVACY_POLICY_VERSION} - Dernière mise à jour : {LAST_UPDATED}
          </ThemedText>
        </View>

        {/* Introduction */}
        <Section title="1. Responsable du traitement">
          <Paragraph>
            WeCamp est une application de gestion d'unités scoutes développée dans le cadre
            d'un projet académique. L'application permet la gestion des membres, des activités
            et des communications au sein des unités scoutes.
          </Paragraph>
          <Paragraph>
            Pour toute question concernant vos données personnelles, vous pouvez nous contacter
            à l'adresse : contact@wecamp.app
          </Paragraph>
        </Section>

        <Section title="2. Données collectées">
          <ThemedText style={[styles.subsectionTitle, { color: textColor }]}>
            2.1 Données d'identification
          </ThemedText>
          <BulletPoint>Nom et prénom</BulletPoint>
          <BulletPoint>Adresse email</BulletPoint>
          <BulletPoint>Numéro de téléphone (optionnel)</BulletPoint>
          <BulletPoint>Date de naissance (pour les scouts)</BulletPoint>
          <BulletPoint>Photo de profil (optionnelle)</BulletPoint>

          <ThemedText style={[styles.subsectionTitle, { color: textColor, marginTop: 16 }]}>
            2.2 Données de santé (scouts uniquement)
          </ThemedText>
          <Paragraph>
            Ces données sont collectées uniquement pour assurer la sécurité des enfants
            lors des activités scoutes :
          </Paragraph>
          <BulletPoint>Groupe sanguin</BulletPoint>
          <BulletPoint>Allergies et leur sévérité</BulletPoint>
          <BulletPoint>Médicaments et traitements</BulletPoint>
          <BulletPoint>Contacts d'urgence</BulletPoint>
          <BulletPoint>Informations d'assurance</BulletPoint>

          <ThemedText style={[styles.subsectionTitle, { color: textColor, marginTop: 16 }]}>
            2.3 Données d'activité
          </ThemedText>
          <BulletPoint>Participation aux défis et événements</BulletPoint>
          <BulletPoint>Messages et publications dans l'application</BulletPoint>
          <BulletPoint>Photos d'activités</BulletPoint>
          <BulletPoint>Points et progression</BulletPoint>
        </Section>

        <Section title="3. Finalités du traitement">
          <Paragraph>Vos données sont utilisées pour :</Paragraph>
          <BulletPoint>Gérer les membres et les unités scoutes</BulletPoint>
          <BulletPoint>Organiser les activités et événements</BulletPoint>
          <BulletPoint>Permettre la communication entre membres</BulletPoint>
          <BulletPoint>Suivre la progression des scouts (défis, badges)</BulletPoint>
          <BulletPoint>Assurer la sécurité des mineurs (fiches santé)</BulletPoint>
          <BulletPoint>Gérer les relations parents-enfants</BulletPoint>
        </Section>

        <Section title="4. Base légale">
          <Paragraph>
            Le traitement de vos données repose sur :
          </Paragraph>
          <BulletPoint>
            Votre consentement explicite lors de l'inscription
          </BulletPoint>
          <BulletPoint>
            L'intérêt légitime pour assurer la sécurité des mineurs lors des activités
          </BulletPoint>
          <BulletPoint>
            L'exécution du contrat de service entre vous et WeCamp
          </BulletPoint>
        </Section>

        <Section title="5. Durée de conservation">
          <Paragraph>
            Vos données sont conservées tant que votre compte est actif.
          </Paragraph>
          <Paragraph>
            Après suppression de votre compte, toutes vos données personnelles sont
            définitivement effacées dans un délai maximum de 30 jours.
          </Paragraph>
          <Paragraph>
            Les données de santé des scouts sont automatiquement supprimées
            à la suppression du compte.
          </Paragraph>
        </Section>

        <Section title="6. Vos droits">
          <Paragraph>
            Conformément au Règlement Général sur la Protection des Données (RGPD),
            vous disposez des droits suivants :
          </Paragraph>
          <BulletPoint>
            Droit d'accès : obtenir une copie de vos données personnelles
          </BulletPoint>
          <BulletPoint>
            Droit de rectification : corriger vos données inexactes
          </BulletPoint>
          <BulletPoint>
            Droit à l'effacement : supprimer votre compte et toutes vos données
          </BulletPoint>
          <BulletPoint>
            Droit à la portabilité : recevoir vos données dans un format structuré
          </BulletPoint>
          <BulletPoint>
            Droit d'opposition : vous opposer à certains traitements
          </BulletPoint>
          <Paragraph>
            Pour exercer ces droits, utilisez les paramètres de l'application ou
            contactez-nous à : contact@wecamp.app
          </Paragraph>
        </Section>

        <Section title="7. Mineurs">
          <View style={[styles.warningBox, { backgroundColor: `${BrandColors.accent[500]}15`, borderColor: BrandColors.accent[500] }]}>
            <Ionicons name="warning" size={20} color={BrandColors.accent[500]} />
            <ThemedText style={[styles.warningText, { color: BrandColors.accent[700] }]}>
              Dispositions spéciales pour les utilisateurs mineurs
            </ThemedText>
          </View>
          <Paragraph>
            Pour les utilisateurs âgés de moins de 16 ans (scouts), le consentement
            d'un parent ou tuteur légal est requis pour l'utilisation de l'application.
          </Paragraph>
          <Paragraph>
            Les parents ou tuteurs légaux peuvent à tout moment :
          </Paragraph>
          <BulletPoint>Accéder aux données de leur enfant</BulletPoint>
          <BulletPoint>Demander la modification des données</BulletPoint>
          <BulletPoint>Demander la suppression du compte de leur enfant</BulletPoint>
          <Paragraph>
            La liaison entre un compte parent et un compte scout se fait via un code
            sécurisé généré par le scout.
          </Paragraph>
        </Section>

        <Section title="8. Sécurité des données">
          <Paragraph>
            Vos données sont stockées de manière sécurisée sur les serveurs Firebase (Google)
            avec les mesures de protection suivantes :
          </Paragraph>
          <BulletPoint>Chiffrement des données en transit (HTTPS/TLS)</BulletPoint>
          <BulletPoint>Chiffrement des données au repos</BulletPoint>
          <BulletPoint>Authentification sécurisée</BulletPoint>
          <BulletPoint>Règles de sécurité strictes sur l'accès aux données</BulletPoint>
          <BulletPoint>Hébergement dans des datacenters certifiés</BulletPoint>
        </Section>

        <Section title="9. Partage des données">
          <Paragraph>
            Vos données ne sont jamais vendues à des tiers.
          </Paragraph>
          <Paragraph>
            Les données peuvent être partagées uniquement :
          </Paragraph>
          <BulletPoint>
            Avec les animateurs de votre unité (pour la gestion des activités)
          </BulletPoint>
          <BulletPoint>
            Avec les parents liés à un scout (pour le suivi de l'enfant)
          </BulletPoint>
          <BulletPoint>
            Avec nos prestataires techniques (Firebase/Google) pour l'hébergement
          </BulletPoint>
        </Section>

        <Section title="10. Modifications de la politique">
          <Paragraph>
            Cette politique de confidentialité peut être mise à jour périodiquement.
            En cas de modification importante, vous serez informé via l'application.
          </Paragraph>
          <Paragraph>
            La poursuite de l'utilisation de l'application après une mise à jour
            vaut acceptation des nouvelles conditions.
          </Paragraph>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            WeCamp - Application de gestion d'unités scoutes
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
