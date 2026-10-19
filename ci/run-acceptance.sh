#!/usr/bin/env bash
set -euo pipefail
cd "$APP_DIR"
test "${NEXT_PUBLIC_FOUNDER50_ENABLED}" = true
test -z "${QA_LOCAL_BACKEND_FIXTURE-}"
test -z "${VERCEL_TOKEN-}"
test -z "${GITHUB_TOKEN-}"
test "$(ip -o link show | wc -l)" -eq 1
test -z "$(ip -4 route show default)"
test -z "$(ip -6 route show default)"
# This negative connectivity assertion sends no request to production.
node -e 'const net=require("net");const s=net.connect({host:"192.0.2.1",port:443});s.setTimeout(1000);s.on("connect",()=>process.exit(1));s.on("error",()=>process.exit(0));s.on("timeout",()=>process.exit(1));'
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3105 \
  > "$EVIDENCE_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
ready=false
for i in $(seq 1 30); do
  kill -0 "$server_pid"
  if curl -q --noproxy '*' --silent --fail http://127.0.0.1:3105/login >/dev/null; then ready=true; break; fi
  sleep 1
done
test "$ready" = true
export QA_BASE_URL=http://127.0.0.1:3105
export QA_OUTPUT_DIR="$EVIDENCE_DIR/enabled"
# Existing harness retains its loopback guard and mocked API contract.
python3 "$CONTROL_DIR/ci/synchronize-skew.py"
NODE_OPTIONS="--import=$CONTROL_DIR/ci/network-audit.mjs --import=$CONTROL_DIR/ci/diagnostics.mjs" node scripts/founder50-remediation-qa.mjs
QA_TIMEZONE_MATRIX=true QA_OUTPUT_DIR="$EVIDENCE_DIR/timezones" \
  NODE_OPTIONS="--import=$CONTROL_DIR/ci/network-audit.mjs --import=$CONTROL_DIR/ci/diagnostics.mjs" node scripts/founder50-remediation-qa.mjs
