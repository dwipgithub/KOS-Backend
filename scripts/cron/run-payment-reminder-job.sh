#!/bin/bash

# ======================
# SAFE MODE (lebih stabil daripada set -e saja)
# ======================
set -euo pipefail

# ======================
# SET BASE DIRECTORY
# ======================
BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$BASE_DIR" || exit 1

# ======================
# PATH (MAC + UBUNTU COMPATIBLE)
# ======================
# export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:$PATH"

# ======================
# SET LOG FILE
# ======================
LOG_FILE="$BASE_DIR/logs/payment-reminder-job.log"
mkdir -p "$BASE_DIR/logs"

# aktifkan logging SEMUA output
exec >> "$LOG_FILE" 2>&1

# ======================
# HEADER LOG
# ======================
echo "==================================="
echo "🚀 Payment Reminder Job START"
echo "📂 Directory: $BASE_DIR"
echo "⏰ Time: $(date)"
echo "==================================="

# ======================
# CEK NODE
# ======================
NODE_BIN=$(command -v node || true)

if [ -z "$NODE_BIN" ]; then
    echo "❌ Node.js tidak ditemukan"
    exit 1
fi

echo "🟢 Node path: $NODE_BIN"

# ======================
# CEK FILE JOB
# ======================
JOB_FILE="$BASE_DIR/jobs/runPaymentReminderJob.js"

if [ ! -f "$JOB_FILE" ]; then
    echo "❌ File job tidak ditemukan: $JOB_FILE"
    exit 1
fi

echo "📄 Job file: OK"

# ======================
# RUN JOB
# ======================
echo "🚀 Menjalankan Node Job..."

$NODE_BIN "$JOB_FILE"

echo "✅ Job selesai sukses"
echo "==================================="
echo ""