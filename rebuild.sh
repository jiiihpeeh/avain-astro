#!/bin/sh
set -e

cd "$(dirname "$0")" || exit 1

# Load environment
if [ -f ".env" ]; then
  echo "📦 Loading .env"
  set -a
  . ./.env
  set +a
fi

# Ensure PATH is set
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

echo "🛠 Rebuilding Astro site..."
npm run build || {
  echo "❌ Build failed."
  #exit 1
}

echo "🔁 Restarting astro.service..."
sudo /bin/systemctl restart astro.service || {
  echo "❌ Failed to restart astro.service."
  #exit 1
}

echo "✅ Rebuild and restart completed."
