#!/bin/sh
set -eu

ROOT="/opt/empreende-facil/app"
ENV_FILE="/opt/empreende-facil/.env"

if [ "$(id -u)" -eq 0 ]; then
  PODMAN="podman"
else
  PODMAN="sudo podman"
fi

cd "$ROOT"
# shellcheck disable=SC2086
$PODMAN compose -f "$ROOT/docker/docker-compose.prod.yml" --env-file "$ENV_FILE" --profile certbot run --rm certbot renew --webroot -w /var/www/certbot
$PODMAN exec empreende-facil-nginx nginx -s reload
