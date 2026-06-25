#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/photos"
OUT="$ROOT/photos-webp"
MAX_WIDTH="${MAX_WIDTH:-1920}"
QUALITY="${QUALITY:-84}"

if ! command -v magick >/dev/null; then
  echo "ImageMagick (magick) is required." >&2
  exit 1
fi

mkdir -p "$OUT"

while IFS= read -r -d '' file; do
  rel="${file#"$SRC"/}"
  target="$OUT/${rel%.*}.webp"
  mkdir -p "$(dirname "$target")"
  magick "$file" -resize "${MAX_WIDTH}x${MAX_WIDTH}>" -strip -quality "$QUALITY" "$target"
  echo "$(du -h "$file" | cut -f1) -> $(du -h "$target" | cut -f1)  $rel"
done < <(find "$SRC" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo "Done. Output: $OUT"
