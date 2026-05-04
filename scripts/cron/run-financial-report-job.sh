#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$BASE_DIR" || exit

# ======================
# FIX PATH (AMAN UNTUK MAC & CRON)
# ======================
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:$PATH"

# ======================
# SET LOG FILE
# ======================
LOG_FILE="$BASE_DIR/logs/financial-job.log"
mkdir -p "$BASE_DIR/logs"

exec >> "$LOG_FILE" 2>&1

# ======================
# CEK NODE
# ======================
NODE_BIN=$(command -v node)

if [ -z "$NODE_BIN" ]; then
    echo "❌ Node.js tidak ditemukan"
    exit 1
fi

echo "==================================="
echo "🚀 Menjalankan Financial Report Job"
echo "📂 Directory: $BASE_DIR"
echo "⏰ Waktu: $(date)"
echo "==================================="

if $NODE_BIN jobs/runFinancialReportJob.js; then
    echo "✅ Job berhasil"
else
    echo "❌ Job gagal"
    exit 1
fi

echo ""