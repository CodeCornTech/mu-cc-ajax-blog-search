#!/usr/bin/env bash
set -e

# =============================================================================
# CodeCorn™ – MU Plugin i18n Helper
# =============================================================================
# Version : 1.0.0
# Author  : CodeCorn™ Technology
#
# Genera:
#   - .pot
#   - .po ( locale )
#   - .mo
#
# NOTE IMPORTANTI:
# - Per MU-plugins WordPress carica SOLO da:
#   wp-content/mu-plugins/languages/
# =============================================================================

SCRIPT_NAME="$(basename "$0")"
SCRIPT_VERSION="1.0.0"

# =============================================================================
# ANSI COLORS
# =============================================================================
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"

RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"

# =============================================================================
# DEFAULTS
# =============================================================================
CLI_CMD="wp --allow-root i18n"
LOCALE="it_IT"
TARGET_DIR="wp-content/mu-plugins/languages"

SOURCE_DIR=""
TEXT_DOMAIN=""

# =============================================================================
# HEADER
# =============================================================================
print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "────────────────────────────────────────────────────────────"
    echo "  CodeCorn™ MU Plugin i18n Helper"
    echo "  Script : ${SCRIPT_NAME}"
    echo "  Version: ${SCRIPT_VERSION}"
    echo "────────────────────────────────────────────────────────────"
    echo -e "${RESET}"
}

# =============================================================================
# USAGE
# =============================================================================
usage() {
    echo -e "${BOLD}Usage:${RESET}"
    echo "  $SCRIPT_NAME <SOURCE_DIR> <TEXT_DOMAIN>"
    echo
    echo -e "${BOLD}Options:${RESET}"
    echo "  -s, --source     Directory sorgente MU-plugin"
    echo "  -d, --domain     Text domain"
    echo "  -l, --locale     Locale ( default: it_IT )"
    echo "  -h, --help       Mostra questo help"
    echo "  -v, --version    Mostra versione script"
    echo
    echo -e "${BOLD}Example:${RESET}"
    echo "  $SCRIPT_NAME wp-content/mu-plugins/codecorn/ajax-blog-search cc-ajax-blog-search"
    echo
}

# =============================================================================
# VERSION
# =============================================================================
if [[ "$1" == "--version" || "$1" == "-v" ]]; then
    echo "$SCRIPT_NAME v$SCRIPT_VERSION"
    exit 0
fi

# =============================================================================
# ARG PARSING
# =============================================================================
while [[ $# -gt 0 ]]; do
    case "$1" in
    -s | --source)
        SOURCE_DIR="$2"
        shift 2
        ;;
    -d | --domain)
        TEXT_DOMAIN="$2"
        shift 2
        ;;
    -l | --locale)
        LOCALE="$2"
        shift 2
        ;;
    -h | --help)
        usage
        exit 0
        ;;
    *)
        # fallback positional
        if [[ -z "$SOURCE_DIR" ]]; then
            SOURCE_DIR="$1"
        elif [[ -z "$TEXT_DOMAIN" ]]; then
            TEXT_DOMAIN="$1"
        else
            echo -e "${RED}❌ Argomento sconosciuto: $1${RESET}"
            usage
            exit 1
        fi
        shift
        ;;
    esac
done

# =============================================================================
# INTERACTIVE FALLBACK
# =============================================================================
if [[ -z "$SOURCE_DIR" ]]; then
    read -rp "📂 Inserisci SOURCE_DIR: " SOURCE_DIR
fi

if [[ -z "$TEXT_DOMAIN" ]]; then
    read -rp "🏷️  Inserisci TEXT_DOMAIN: " TEXT_DOMAIN
fi

# =============================================================================
# VALIDATION
# =============================================================================
print_header

command -v wp >/dev/null 2>&1 || {
    echo -e "${RED}❌ WP-CLI non trovato${RESET}"
    exit 1
}

if [[ ! -d "$SOURCE_DIR" ]]; then
    echo -e "${RED}❌ SOURCE_DIR non esiste:${RESET} $SOURCE_DIR"
    exit 1
fi

if [[ -z "$TEXT_DOMAIN" ]]; then
    echo -e "${RED}❌ TEXT_DOMAIN non valido${RESET}"
    exit 1
fi

mkdir -p "$TARGET_DIR"

POT_FILE="${TARGET_DIR}/${TEXT_DOMAIN}.pot"
PO_FILE="${TARGET_DIR}/${TEXT_DOMAIN}-${LOCALE}.po"

echo -e "${BLUE}📦 Source   :${RESET} $SOURCE_DIR"
echo -e "${BLUE}🏷️  Domain   :${RESET} $TEXT_DOMAIN"
echo -e "${BLUE}🌍 Locale   :${RESET} $LOCALE"
echo -e "${BLUE}📁 Target   :${RESET} $TARGET_DIR"
echo

# =============================================================================
# STEP 1 – MAKE POT
# =============================================================================
echo -e "${CYAN}🧠 Generazione POT${RESET}"
$CLI_CMD make-pot \
    "$SOURCE_DIR" \
    "$POT_FILE" \
    --domain="$TEXT_DOMAIN" \
    --exclude=node_modules,vendor,tests,dist

# =============================================================================
# STEP 2 – CREATE PO
# =============================================================================
if [[ ! -f "$PO_FILE" ]]; then
    echo -e "${CYAN}📄 Creo PO${RESET}"
    cp "$POT_FILE" "$PO_FILE"
else
    echo -e "${YELLOW}📄 PO già esistente${RESET}"
fi

# =============================================================================
# STEP 3 – EDIT PO ( NO CI )
# =============================================================================
if [[ -z "$CI" ]]; then
    echo -e "${CYAN}✏️  Apri PO per traduzione${RESET}"
    nano "$PO_FILE"
fi

# =============================================================================
# STEP 4 – MAKE MO
# =============================================================================
echo -e "${CYAN}⚙️  Compilazione MO${RESET}"
$CLI_CMD make-mo "$TARGET_DIR"

# =============================================================================
# DONE
# =============================================================================
echo
echo -e "${GREEN}✅ i18n MU-plugin completato${RESET}"
echo -e "${DIM}📁 ${TARGET_DIR}${RESET}"

# =============================================================================
## 🚀 Esempi di utilizzo

# ```bash
# ./mu-i18n.sh wp-content/mu-plugins/codecorn/ajax-blog-search cc-ajax-blog-search
# ```

# oppure:

# ```bash
# ./mu-i18n.sh --source wp-content/mu-plugins/codecorn/foo --domain foo-text-domain
# ```

# oppure interattivo:

# ```bash
# ./mu-i18n.sh
# ```
# =============================================================================
