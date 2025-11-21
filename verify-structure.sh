#!/bin/bash

echo "🔍 Vérification de la Nouvelle Structure..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 ${RED}(manquant)${NC}"
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 ${RED}(manquant)${NC}"
    return 1
  fi
}

echo "📁 Structure des dossiers src/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_dir "src/features"
check_dir "src/features/auth"
check_dir "src/features/challenges"
check_dir "src/features/events"
check_dir "src/features/messaging"
check_dir "src/features/documents"
check_dir "src/features/profile"
check_dir "src/features/units"
check_dir "src/features/leaderboard"
check_dir "src/shared"
check_dir "src/shared/components"
check_dir "src/shared/services"
check_dir "src/core"
check_dir "src/core/config"
check_dir "src/core/constants"
check_dir "src/core/context"
echo ""

echo "📝 Services organisés"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/features/challenges/services/challenge-service.ts"
check_file "src/features/events/services/event-service.ts"
check_file "src/features/messaging/services/messaging-service.ts"
check_file "src/features/profile/services/user-service.ts"
check_file "src/features/units/services/unit-service.ts"
check_file "src/shared/services/storage-service.ts"
echo ""

echo "📦 Barrel Exports (index.ts)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/features/challenges/index.ts"
check_file "src/features/events/index.ts"
check_file "src/features/messaging/index.ts"
check_file "src/features/profile/index.ts"
check_file "src/features/units/index.ts"
check_file "src/shared/index.ts"
check_file "src/core/index.ts"
echo ""

echo "📚 Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "ARCHITECTURE.md"
check_file "GUIDE_DEVELOPPEUR.md"
check_file "MIGRATION.md"
check_file "AVANT_APRES.md"
check_file "QUICK_START.md"
check_file "README.md"
check_file "src/README.md"
echo ""

echo "⚙️ Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "tsconfig.json"
check_file ".vscode/settings.json"
echo ""

# Vérifier tsconfig.json contient les path aliases
if grep -q "@features" tsconfig.json; then
  echo -e "${GREEN}✓${NC} Path aliases configurés dans tsconfig.json"
else
  echo -e "${RED}✗${NC} Path aliases manquants dans tsconfig.json"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Vérification terminée !${NC}"
echo ""
echo "📋 Prochaines étapes :"
echo "  1. Lire ARCHITECTURE.md"
echo "  2. Lire GUIDE_DEVELOPPEUR.md"
echo "  3. Migrer les imports (voir MIGRATION.md)"
echo ""
