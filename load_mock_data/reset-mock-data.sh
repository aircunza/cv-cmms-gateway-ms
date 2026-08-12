#!/usr/bin/env bash
#
# clean-dbs.sh
#
# Deletes all application data from the 3 microservice DBs.
# Does NOT load mock data and does NOT touch Prisma migrations.
#
# Requirements:
#   - Docker containers up (docker compose up -d)
#   - sqlcmd available inside each container
#

set -euo pipefail

SQLCMD_BIN="/opt/mssql-tools18/bin/sqlcmd"
SA_USER="sa"
SA_PASSWORD='Pass1234*'
DB_NAME="master"
TMP_FILE="/tmp/db_cleanup.sql"

cleanup_sql() {
  local container="$1"

  case "$container" in
    auth_db)
      cat > /tmp/db_cleanup_body.sql <<'EOF'
DELETE FROM [dbo].[user_org_permissions];
DELETE FROM [dbo].[users];
DELETE FROM [dbo].[organizations];
EOF
      ;;

    asset_db)
      cat > /tmp/db_cleanup_body.sql <<'EOF'
DELETE FROM [dbo].[mnt_assets];
DELETE FROM [dbo].[work_centers];
DELETE FROM [dbo].[work_areas];
DELETE FROM [dbo].[organizations];
EOF
      ;;

    exe_maintenance_db)
      cat > /tmp/db_cleanup_body.sql <<'EOF'
DELETE FROM [dbo].[mnt_operation_human_resource_usages];
DELETE FROM [dbo].[mnt_operation_material_usages];
DELETE FROM [dbo].[mnt_wo_operations];
DELETE FROM [dbo].[mnt_work_orders];
DELETE FROM [dbo].[mnt_work_request];
DELETE FROM [dbo].[mnt_human_resources];
DELETE FROM [dbo].[mnt_assets];
EOF
      ;;

    *)
      echo "ERROR: no cleanup defined for container '$container'" >&2
      exit 1
      ;;
  esac
}

run_sql() {
  local container="$1"

  docker exec "$container" "$SQLCMD_BIN" \
    -S localhost \
    -U "$SA_USER" \
    -P "$SA_PASSWORD" \
    -d "$DB_NAME" \
    -C \
    -b \
    -i "$TMP_FILE"
}

for container in auth_db asset_db exe_maintenance_db; do
  echo "============================================================"
  echo ">>> [$container] cleaning data..."

  cleanup_sql "$container"

  docker cp /tmp/db_cleanup_body.sql "$container:$TMP_FILE"

  run_sql "$container"

  docker exec "$container" rm -f "$TMP_FILE" 2>/dev/null || true
  rm -f /tmp/db_cleanup_body.sql

  echo ">>> [$container] cleaned successfully."
done

echo "============================================================"
echo "All databases cleaned successfully."