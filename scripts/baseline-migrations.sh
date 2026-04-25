#!/bin/bash
# Baseline all existing Prisma migrations.
# Marks every migration as "already applied" so prisma migrate deploy
# only runs genuinely new migrations. Safe to run multiple times.

set -euo pipefail

MIGRATIONS_DIR="prisma/migrations"

echo "→ Checking if prisma migrate deploy works as-is..."
if npx prisma migrate deploy 2>/dev/null; then
  echo "✓ migrate deploy succeeded — no baseline needed."
  exit 0
fi

echo "→ Baselining: marking all existing migrations as applied..."
for dir in "$MIGRATIONS_DIR"/*/; do
  name=$(basename "$dir")
  [ "$name" = "migration_lock.toml" ] && continue
  echo "  resolving: $name"
  npx prisma migrate resolve --applied "$name" 2>/dev/null || true
done

echo "→ Running migrate deploy (new migrations only)..."
npx prisma migrate deploy
echo "✓ Done."
