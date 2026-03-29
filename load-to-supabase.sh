#!/bin/bash

# Load Hardiness Zones to Supabase via psql
#
# Usage:
#   1. Get your Supabase connection string from:
#      Dashboard → Project Settings → Database → Connection String (Direct connection)
#   2. Replace the placeholders below with your actual values
#   3. Run: bash load-to-supabase.sh

# Your Supabase connection details
DB_HOST="db.pfkxhoqlfflgjlovgenc.supabase.co"  # Replace with your host
DB_PASSWORD="1s4Belly!23_woi"         # Replace with your password

# Connection string
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f ~/Downloads/hardiness_zones.sql

echo ""
echo "Data loading complete!"
echo "Verify with: SELECT COUNT(*) FROM hardiness_zones;"
