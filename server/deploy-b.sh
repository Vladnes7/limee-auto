#!/usr/bin/env bash
# Выкладка варианта Б (первый экран с фото Bentley вместо фильма) на VPS, порт 8084.
# Вариант А (фильм, порт 8083) не трогает. Запуск из папки site/: bash server/deploy-b.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8084
NAME=limee-auto-b
SSH_OPTS=(-o ConnectTimeout=20 -o HostName=ylk89.ru -o HostKeyAlias=37.77.106.12)
ssh() { command ssh "${SSH_OPTS[@]}" "$@"; }
scp() { command scp "${SSH_OPTS[@]}" "$@"; }

cd "$ROOT"
HERO=photo npx vite build --outDir dist-b --emptyOutDir
rm -rf dist-b/media/film # фильм в варианте Б не нужен

ssh sites "set -e
  if ss -ltn | grep -q ':$PORT ' && ! [ -e /etc/nginx/sites-enabled/$NAME ]; then echo 'порт $PORT занят другим сайтом'; exit 1; fi
  mkdir -p /var/www/$NAME"

rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist-b/ sites:/var/www/$NAME/
scp -q "$ROOT/server/nginx-$NAME.conf" sites:/etc/nginx/sites-available/$NAME

ssh sites "set -e
  chown -R www-data:www-data /var/www/$NAME
  ln -sfn /etc/nginx/sites-available/$NAME /etc/nginx/sites-enabled/$NAME
  if ! nginx -t 2>/dev/null; then rm -f /etc/nginx/sites-enabled/$NAME; nginx -t; exit 1; fi
  systemctl reload nginx
  if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then ufw allow $PORT/tcp comment 'limee-auto variant B' >/dev/null; fi
  sleep 1
  curl -s -o /dev/null -w 'page %{http_code}\n' http://127.0.0.1:$PORT/
  curl -s -o /dev/null -w 'catalog %{http_code}\n' http://127.0.0.1:$PORT/catalog/
  curl -s -o /dev/null -w 'variant A still %{http_code}\n' http://127.0.0.1:8083/"
echo "Готово: http://37.77.106.12:$PORT"
