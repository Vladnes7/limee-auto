#!/usr/bin/env bash
# Выкладка Limee Auto на VPS (ssh alias "sites"), демо на порту 8083.
# Запуск из папки site/: bash server/deploy.sh
# Чужие сайты и конфиги не трогает; конфиг с ошибкой откатывается до перезагрузки nginx.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8083
NAME=limee-auto
# VPN Влада роняет SSH на голый IP; через домен того же сервера проходит.
SSH_OPTS=(-o ConnectTimeout=20 -o HostName=ylk89.ru -o HostKeyAlias=37.77.106.12)
ssh() { command ssh "${SSH_OPTS[@]}" "$@"; }
scp() { command scp "${SSH_OPTS[@]}" "$@"; }

cd "$ROOT"
npm run build

# Проверки до любых изменений на сервере.
ssh sites "set -e
  if ss -ltn | grep -q ':$PORT ' && ! [ -e /etc/nginx/sites-enabled/$NAME ]; then echo 'порт $PORT занят другим сайтом'; exit 1; fi
  mkdir -p /var/www/$NAME"

rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist/ sites:/var/www/$NAME/
scp -q "$ROOT/server/nginx-$NAME.conf" sites:/etc/nginx/sites-available/$NAME

ssh sites "set -e
  chown -R www-data:www-data /var/www/$NAME
  ln -sfn /etc/nginx/sites-available/$NAME /etc/nginx/sites-enabled/$NAME
  if ! nginx -t 2>/dev/null; then rm -f /etc/nginx/sites-enabled/$NAME; nginx -t; exit 1; fi
  systemctl reload nginx
  if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then ufw allow $PORT/tcp comment 'limee-auto demo' >/dev/null; fi
  sleep 1
  curl -s -o /dev/null -w 'page %{http_code}\n' http://127.0.0.1:$PORT/
  curl -s -o /dev/null -w 'catalog %{http_code}\n' http://127.0.0.1:$PORT/catalog/
  curl -sI http://127.0.0.1:$PORT/media/film/film-720.mp4 | head -4"
echo "Готово: http://37.77.106.12:$PORT"
