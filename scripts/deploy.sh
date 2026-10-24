#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-/opt/empreende-facil/.env}"
DOMAIN="${DOMAIN:-empreende-facil-api.duckdns.org}"
CERT_FILE="/opt/empreende-facil/letsencrypt/live/${DOMAIN}/fullchain.pem"
API_IMAGE="${API_IMAGE:-ghcr.io/brunog2/empreende-facil-api:latest}"

if [ "$(id -u)" -eq 0 ]; then
  PODMAN="podman"
  systemctl enable --now podman.socket
else
  sudo systemctl enable --now podman.socket
  # sudo drops API_IMAGE unless it is preserved, and Compose would fall back to :latest.
  PODMAN="sudo --preserve-env=API_IMAGE,NGINX_CONF podman"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

mkdir -p /opt/empreende-facil/letsencrypt /opt/empreende-facil/certbot-www

compose() {
  # shellcheck disable=SC2086
  $PODMAN compose -f "$ROOT/docker/docker-compose.prod.yml" --env-file "$ENV_FILE" "$@"
}

wait_for() {
  url="$1"
  attempt=0
  while [ "$attempt" -lt 45 ]; do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
  echo "Timed out waiting for $url" >&2
  $PODMAN logs --tail 80 empreende-facil-api >&2 || true
  return 1
}

export API_IMAGE

if [ ! -f "$CERT_FILE" ]; then
  export NGINX_CONF="$ROOT/docker/nginx/http.conf"
  compose pull
  compose up -d --force-recreate --remove-orphans postgres api nginx
  wait_for "http://127.0.0.1/api/plans"
  compose --profile certbot run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --agree-tos \
    --non-interactive \
    --register-unsafely-without-email \
    --keep-until-expiring
fi

export NGINX_CONF="$ROOT/docker/nginx/https.conf"
compose pull
compose up -d --force-recreate --remove-orphans
wait_for "https://${DOMAIN}/api/plans"

if [ -f "$ROOT/scripts/empreende-facil-cert-renew.service" ]; then
  sudo cp "$ROOT/scripts/empreende-facil-cert-renew.service" /etc/systemd/system/empreende-facil-cert-renew.service
  sudo cp "$ROOT/scripts/empreende-facil-cert-renew.timer" /etc/systemd/system/empreende-facil-cert-renew.timer
  sudo systemctl daemon-reload
  sudo systemctl enable --now empreende-facil-cert-renew.timer
fi

echo "API is available at https://${DOMAIN}/api"
