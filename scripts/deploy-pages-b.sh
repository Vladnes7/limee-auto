#!/usr/bin/env bash
# Adds variant B (photo hero instead of the film) to GitHub Pages under /limee-auto/b/.
# Takes the current gh-pages commit as it is, replaces only its b/ folder and pushes a normal
# (fast-forward) commit, so variant A at /limee-auto/ is not touched.
# Run from site/: bash scripts/deploy-pages-b.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
HERO=photo npx vite build --outDir dist-b --emptyOutDir
rm -rf dist-b/media/film

OUT="$(mktemp -d)"
INDEX="$(mktemp -u)"
trap 'rm -rf "$OUT" "$INDEX"' EXIT
mkdir "$OUT/b"
cp -R dist-b/. "$OUT/b/"
node scripts/pages-base.mjs "$OUT/b" /limee-auto/b

git fetch -q origin gh-pages
PARENT="$(git rev-parse origin/gh-pages)"
export GIT_INDEX_FILE="$INDEX"
git read-tree "$PARENT"
git rm -r -q --cached --ignore-unmatch b
git --git-dir="$ROOT/.git" --work-tree="$OUT" -C "$OUT" add -A b
TREE="$(git write-tree)"
unset GIT_INDEX_FILE
COMMIT="$(git commit-tree "$TREE" -p "$PARENT" -m "Pages: variant B (photo hero) of $(git rev-parse --short HEAD)")"
git push origin "$COMMIT:refs/heads/gh-pages"
echo "Готово: https://vladnes7.github.io/limee-auto/b/ (обновится через 1–2 минуты)"
