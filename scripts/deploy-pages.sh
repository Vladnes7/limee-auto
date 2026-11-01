#!/usr/bin/env bash
# Publishes the demo to GitHub Pages: https://vladnes7.github.io/limee-auto/
# Builds the site, moves every root link under /limee-auto/ (scripts/pages-base.mjs) and force-pushes the
# result as the single commit of the gh-pages branch. The commit is made inside this repository, so the
# photos and videos it shares with main are not uploaded again — only changed HTML/JS/CSS go up.
# Run from site/: bash scripts/deploy-pages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build

OUT="$(mktemp -d)"
INDEX="$(mktemp -u)"
trap 'rm -rf "$OUT" "$INDEX"' EXIT
cp -R dist/. "$OUT/"
node scripts/pages-base.mjs "$OUT" /limee-auto
touch "$OUT/.nojekyll" # serve files as they are, no Jekyll

export GIT_INDEX_FILE="$INDEX"
git --git-dir="$ROOT/.git" --work-tree="$OUT" -C "$OUT" add -A .
TREE="$(git write-tree)"
unset GIT_INDEX_FILE
COMMIT="$(git commit-tree "$TREE" -m "Pages build of $(git rev-parse --short HEAD)")"
git push -f origin "$COMMIT:refs/heads/gh-pages"
echo "Готово: https://vladnes7.github.io/limee-auto/ (обновится через 1–2 минуты)"
