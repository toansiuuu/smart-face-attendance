#!/usr/bin/env bash
# Run from Git Bash on Windows, or Bash on Linux/macOS. Docker must be running.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

command -v docker >/dev/null 2>&1 || { echo 'Install Docker Desktop and start it first.' >&2; exit 1; }
docker compose version >/dev/null
docker info >/dev/null 2>&1 || { echo 'Start Docker Desktop, then run this script again.' >&2; exit 1; }

# The same secret reaches Java and Python; it never enters the frontend.
if [[ -z "${LIVENESS_SECRET:-}" ]]; then
  LIVENESS_SECRET="$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')"
fi
export LIVENESS_SECRET

docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face \
  up -d --build --wait --wait-timeout 180

printf '\nApplication: http://localhost:5173\nLogin: http://localhost:5173/login\n'
printf 'Development account: admin / admin1234567890 (if unchanged)\n'
printf '\nFace identity matching and liveness are ready. Enroll employees through the manager dashboard.\n'
printf 'Logs: docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face logs -f\n'
printf 'Stop: docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face stop\n'
