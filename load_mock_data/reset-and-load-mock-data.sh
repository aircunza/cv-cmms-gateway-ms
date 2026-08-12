#!/usr/bin/env bash
#
# reset-and-load-mock-data.sh
#
# Resets (deletes) and reloads the mock data into the 3 microservice DBs:
#   auth_db            (port 1433) -> 01_auth_ms.sql
#   asset_db           (port 1434) -> 02_asset_management_ms.sql
#   exe_maintenance_db (port 1435) -> 03_maintenance_execution_ms.sql
#
# Requirements:
#   - Docker containers up (docker compose up -d).
#   - Tables already created via Prisma migrations (only data is reset,
#     _prisma_migrations is never touched).
#   - sqlcmd available inside each container (/opt/mssql-tools18/bin/sqlcmd).
#
# Usage:
#   bash reset-and-load-mock-data.sh
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SQLCMD_BIN="/opt/mssql-tools18/bin/sqlcmd"
SA_USER="sa"
SA_PASSWORD='Pass1234*'
DB_NAME="master"
TMP_FILE="/tmp/mock_cleanup.sql"

# <container_name>|<mock_sql_file>|<comma separated tables to verify>
CONFIG=(
  "auth_db|01_auth_ms.sql|organizations,users,user_org_permissions"
  "asset_db|02_asset_management_ms.sql|organizations,work_areas,work_centers,mnt_assets"
  "exe_maintenance_db|03_maintenance_execution_ms.sql|mnt_assets,mnt_human_resources,mnt_work_request,mnt_work_orders,mnt_wo_operations,mnt_operation_material_usages,mnt_operation_human_resource_usages"
)

run_sql() {
  local container="$1"
  local file="$2"
  docker exec "$container" "$SQLCMD_BIN" \
    -S localhost -U "$SA_USER" -P "$SA_PASSWORD" -d "$DB_NAME" -C -b \
    -i "$file"
}

cleanup_sql() {
  # DELETE in FK order (children first) for each DB known by the caller.
  local container="$1"
  case "$container" in
    auth_db)
      cat > /tmp/mock_cleanup_body.sql <<'EOF'
DELETE FROM [dbo].[user_org_permissions];
DELETE FROM [dbo].[users];
DELETE FROM [dbo].[organizations];
EOF
      ;;
    asset_db)
      cat > /tmp/mock_cleanup_body.sql <<'EOF'
DELETE FROM [dbo].[mnt_assets];
DELETE FROM [dbo].[work_centers];
DELETE FROM [dbo].[work_areas];
DELETE FROM [dbo].[organizations];
EOF
      ;;
    exe_maintenance_db)
      cat > /tmp/mock_cleanup_body.sql <<'EOF'
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

verify_counts() {
  local container="$1"
  local tables="$2"

  if [ -z "$tables" ]; then
    return 0
  fi

  local query=""
  for t in ${tables//,/ }; do
    query="${query}SELECT '$t' AS [table], COUNT(*) AS [rows] FROM [dbo].[$t] UNION ALL "
  done
  query="${query%UNION ALL }"

  if [ -n "$query" ]; then
    docker exec "$container" "$SQLCMD_BIN" \
      -S localhost -U "$SA_USER" -P "$SA_PASSWORD" -d "$DB_NAME" -C -b -W \
      -Q "$query"
  fi
}

for entry in "${CONFIG[@]}"; do
  IFS='|' read -r container mock_file verify_tables <<< "$entry"
  mock_path="$HERE/$mock_file"

  if [ ! -f "$mock_path" ]; then
    echo "ERROR: mock file not found: $mock_path" >&2
    exit 1
  fi

  echo "============================================================"
  echo ">>> [$container] cleaning data..."
  cleanup_sql "$container"
  docker cp /tmp/mock_cleanup_body.sql "$container:$TMP_FILE"
  run_sql "$container" "$TMP_FILE"
  rm -f /tmp/mock_cleanup_body.sql

  echo ">>> [$container] loading mock data ($mock_file)..."
  docker cp "$mock_path" "$container:$TMP_FILE"
  run_sql "$container" "$TMP_FILE"
  docker exec "$container" rm -f "$TMP_FILE" 2>/dev/null || true

  echo ">>> [$container] verification:"
  verify_counts "$container" "$verify_tables"
done

echo "============================================================"
echo "Mock data reloaded successfully."