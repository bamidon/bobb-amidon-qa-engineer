#!/bin/bash
set -e

# xvfb enables headed browser tests — non-fatal if unavailable
sudo apt-get update && sudo apt-get install -y xvfb xauth || echo "Warning: xvfb unavailable, test:headed will not work"

# Symlink bridge_app source so test imports resolve
ln -sf ../../bridge_app bridge_tests/tests/bridge_app

# Install dependencies
npm install --prefix bridge_app

cd bridge_tests
npm install
npx playwright install chromium --with-deps
