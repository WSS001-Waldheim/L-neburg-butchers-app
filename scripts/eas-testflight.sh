#!/usr/bin/env bash
# Build a store-distribution iOS binary and upload it to App Store Connect (TestFlight).
# Requires: Apple Developer Program, Expo account, network.
# Does not embed secrets — log in interactively or use EXPO_TOKEN / ASC API key.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROFILE="${EAS_PROFILE:-testflight}"
AUTO_SUBMIT="${AUTO_SUBMIT:-1}"

echo "==> Lüneburg Country Butchery — EAS iOS TestFlight"
echo "    profile: ${PROFILE}"
echo "    bundle:  co.wssfarming.luneburg (confirm in Apple Developer before first build)"
echo "    version: see app.json expo.version / ios.buildNumber"
echo

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found — install Node.js first." >&2
  exit 1
fi

if [[ ! -f eas.json ]]; then
  echo "eas.json missing — aborting." >&2
  exit 1
fi

echo "==> Ensuring dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Checking Expo / EAS login (eas whoami)"
npx eas-cli@latest whoami || {
  echo "Not logged in. Run: npx eas-cli@latest login"
  exit 1
}

if ! grep -q '"projectId"' app.json 2>/dev/null && ! grep -q projectId app.config.* 2>/dev/null; then
  echo
  echo "NOTE: No EAS projectId in app config yet."
  echo "      First time only: npx eas-cli@latest init"
  echo "      Then re-run this script."
  echo
fi

BUILD_ARGS=(build --platform ios --profile "${PROFILE}" --non-interactive)

if [[ "${AUTO_SUBMIT}" == "1" ]]; then
  echo "==> Building + auto-submit to App Store Connect / TestFlight"
  npx eas-cli@latest "${BUILD_ARGS[@]}" --auto-submit --auto-submit-with-profile=testflight
else
  echo "==> Building only (set AUTO_SUBMIT=1 to upload)"
  npx eas-cli@latest "${BUILD_ARGS[@]}"
  echo
  echo "When the build finishes, upload with:"
  echo "  npx eas-cli@latest submit --platform ios --profile testflight --latest"
fi

echo
echo "After Apple processing (~5–15 min):"
echo "  1. App Store Connect → TestFlight → add Internal testers (Karl@Wssfarming.co.za)"
echo "  2. Paste review notes from docs/TESTFLIGHT.md"
echo "  3. Testers install via the TestFlight app"
