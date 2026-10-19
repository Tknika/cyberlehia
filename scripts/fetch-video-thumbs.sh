#!/usr/bin/env bash
# Download the preview image of every video used in a {{< videos >}} block, so the tiles show it
# without the visitor's browser contacting YouTube (the site loads nothing from YouTube until a click).
#
#   scripts/fetch-video-thumbs.sh
#
# Writes static/images/videos/<VIDEO_ID>.jpg (640px wide) for each ID found in content/ that has no image yet.
# Needs curl and ffmpeg (Windows: `winget install Gyan.FFmpeg`). Run it after adding videos and commit the images.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/static/images/videos"
mkdir -p "$out"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# IDs: the first field of each line inside {{< videos >}} … {{< /videos >}}
ids=$(awk '/\{\{< *videos *>\}\}/{on=1; next} /\{\{< *\/videos *>\}\}/{on=0} on && NF {split($0, a, "|"); gsub(/[ \t\r]/, "", a[1]); if (a[1] != "") print a[1]}' $(find "$root/content" -name '*.md') | sort -u)

for id in $ids; do
  [ -f "$out/$id.jpg" ] && continue
  # maxresdefault is not always available; hqdefault always is
  if curl -sfL -m 30 -o "$tmp/$id.jpg" "https://i.ytimg.com/vi/$id/maxresdefault.jpg" || curl -sfL -m 30 -o "$tmp/$id.jpg" "https://i.ytimg.com/vi/$id/hqdefault.jpg"; then
    # 16:9 crop (hqdefault is 4:3 with black bars), 640px, compressed
    ffmpeg -hide_banner -loglevel error -y -i "$tmp/$id.jpg" -vf "crop=iw:min(ih\,iw*9/16),scale=640:-2:flags=lanczos" -q:v 5 "$out/$id.jpg"
    echo "ok   $id"
  else
    echo "FAIL $id" >&2
  fi
done
du -sh "$out"
