#!/usr/bin/env bash
set -euo pipefail
root=$(pwd)
test -d "$root/app/.next"
test -f "$root/control/ci/run-acceptance.sh"
command -v unshare >/dev/null
command -v setpriv >/dev/null
command -v ip >/dev/null
node_path=$(dirname "$(command -v node)")
browser_cache="$HOME/.cache/ms-playwright"
test -d "$browser_cache"
mkdir -p "$RUNNER_TEMP/founder50-synthetic-home" evidence
# No credential env is forwarded into either application or browser process.
sudo unshare --net --fork bash -euo pipefail -c '
  ip link set lo up
  test "$(ip -o link show | wc -l)" -eq 1
  test -z "$(ip -4 route show default)"
  test -z "$(ip -6 route show default)"
  printf "interfaces:\n"; ip -brief link
  printf "routes:\n"; ip -4 route; ip -6 route
  exec setpriv --reuid "$1" --regid "$2" --init-groups \
    --bounding-set=-all --inh-caps=-all --ambient-caps=-all --no-new-privs \
    env -i PATH="$3:/usr/bin:/bin" HOME="$4" \
    APP_DIR="$5" EVIDENCE_DIR="$6" CONTROL_DIR="$7" \
    PLAYWRIGHT_BROWSERS_PATH="$8" \
    NEXT_PUBLIC_FOUNDER50_ENABLED=true \
    NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:9/api/v1 \
    BACKEND_API_BASE_URL=http://127.0.0.1:9/api/v1 \
    NEXT_PUBLIC_WS_BASE_URL=ws://127.0.0.1:9 \
    NEXT_TELEMETRY_DISABLED=1 CI=true \
    bash "$7/ci/run-acceptance.sh"
' -- "$(id -u)" "$(id -g)" "$node_path" \
  "$RUNNER_TEMP/founder50-synthetic-home" "$root/app" \
  "$root/evidence" "$root/control" "$browser_cache" \
  > evidence/isolation-and-test.log 2>&1
