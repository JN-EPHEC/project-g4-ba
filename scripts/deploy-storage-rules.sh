#!/bin/bash

# Script pour déployer les règles Firebase Storage
# Usage: ./scripts/deploy-storage-rules.sh

echo "🔥 Déploiement des règles Firebase Storage"
echo "=========================================="
echo ""

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI n'est pas installé"
    echo ""
    echo "Pour installer Firebase CLI:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

# Vérifier que l'utilisateur est connecté
echo "🔐 Vérification de l'authentification Firebase..."
firebase projects:list &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Vous n'êtes pas connecté à Firebase"
    echo ""
    echo "Pour vous connecter:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo "✅ Authentifié"
echo ""

# Afficher le projet actuel
echo "📋 Projet Firebase actuel:"
firebase use
echo ""

# Demander confirmation
read -p "❓ Voulez-vous déployer les règles Storage? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Déploiement annulé"
    exit 1
fi

echo ""
echo "🚀 Déploiement en cours..."
echo ""

# Déployer les règles Storage
firebase deploy --only storage:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Règles Storage déployées avec succès!"
    echo ""
    echo "📝 Les utilisateurs peuvent maintenant:"
    echo "   - Upload leur photo de profil (max 5MB)"
    echo "   - Upload des photos pour les défis"
    echo "   - Upload des photos d'albums"
    echo "   - Upload des documents PDF (max 10MB)"
    echo ""
    echo "🔐 Règles de sécurité actives:"
    echo "   - Avatars: Propriétaire uniquement peut modifier"
    echo "   - Photos: Utilisateurs authentifiés"
    echo "   - Documents: Utilisateurs authentifiés"
    echo ""
else
    echo ""
    echo "❌ Erreur lors du déploiement des règles Storage"
    echo ""
    echo "💡 Vérifiez:"
    echo "   - Que vous êtes sur le bon projet Firebase"
    echo "   - Que le fichier storage.rules existe"
    echo "   - Que Firebase Storage est activé dans la console"
    echo ""
    exit 1
fi
