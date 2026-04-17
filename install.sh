#!/usr/bin/env bash
# install.sh — OpenKrew one-liner installer
# curl -fsSL https://openkrew.ai/install.sh | bash

set -e

REPO="https://github.com/openkrew/openkrew"
INSTALL_DIR="$HOME/.openkrew"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "🤝 OpenKrew Installer"
echo "Your AI krew. One chat."
echo ""

# ── Check OS ──────────────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Linux*)   PLATFORM="linux" ;;
  Darwin*)  PLATFORM="macos" ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  *)        echo -e "${RED}❌ Unsupported OS: $OS${NC}"; exit 1 ;;
esac

echo "📦 Platform detected: $PLATFORM"

# ── Check / Install Node.js ───────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo ""
  echo "📥 Node.js not found. Installing..."

  if [ "$PLATFORM" = "macos" ]; then
    if ! command -v brew &> /dev/null; then
      echo "Installing Homebrew first..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install node
  elif [ "$PLATFORM" = "linux" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    echo -e "${YELLOW}⚠️  Please install Node.js 18+ manually from https://nodejs.org${NC}"
    exit 1
  fi
else
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Found: $(node --version)${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
fi

# ── Clone or update repo ──────────────────────────────────────────────
echo ""
if [ -d "$INSTALL_DIR" ]; then
  echo "📂 Updating existing OpenKrew installation..."
  cd "$INSTALL_DIR" && git pull
else
  echo "📥 Cloning OpenKrew..."
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ── Install dependencies ──────────────────────────────────────────────
echo ""
echo "📦 Installing dependencies..."
npm install --silent

# ── Add to PATH ───────────────────────────────────────────────────────
SHELL_RC="$HOME/.bashrc"
[ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"

if ! grep -q "openkrew" "$SHELL_RC" 2>/dev/null; then
  echo "" >> "$SHELL_RC"
  echo "# OpenKrew" >> "$SHELL_RC"
  echo "alias openkrew='node $INSTALL_DIR/src/index.js'" >> "$SHELL_RC"
  echo "alias openkrew-setup='node $INSTALL_DIR/src/setup.js'" >> "$SHELL_RC"
fi

# ── Done ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ OpenKrew installed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run setup:   node $INSTALL_DIR/src/setup.js"
echo "  2. Start krew:  node $INSTALL_DIR/src/index.js"
echo ""
echo "Or restart your terminal and use:"
echo "  openkrew-setup"
echo "  openkrew"
echo ""
