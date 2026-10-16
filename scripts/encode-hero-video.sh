#!/usr/bin/env bash
# Encode the home page background loop from an original video file.
#
#   scripts/encode-hero-video.sh <input-video> [start-seconds] [duration-seconds]
#
# Writes (no audio, 1280px wide, 25 fps, black letterbox bars cropped automatically):
#   static/videos/hero.mp4         H.264, for every browser (aim: ~1–2.5 MB)
#   static/videos/hero.webm        VP9, smaller, used first by browsers that support it
#   static/videos/hero-poster.jpg  first frame, so the poster → video fade is seamless
#
# Then, in content/eu/_index.md AND content/es/_index.md:
#   video:
#     src: videos/hero.mp4
#     webm: videos/hero.webm
#     poster: videos/hero-poster.jpg
#
# Pick a calm 8–15 s stretch that loops well (no titles or logos, no hard cuts at the ends).
# Requires ffmpeg (Windows: `winget install Gyan.FFmpeg`, then open a new terminal).
set -euo pipefail

in="${1:?usage: $0 <input-video> [start-seconds] [duration-seconds]}"
start="${2:-0}"
duration="${3:-12}"
out="$(cd "$(dirname "$0")/.." && pwd)/static/videos"
mkdir -p "$out"

# Detect letterbox bars on the chosen stretch (the 2026 summary is ~2.25:1 inside 16:9).
crop="$(ffmpeg -hide_banner -ss "$start" -t "$duration" -i "$in" -vf cropdetect=24:2:0 -f null - 2>&1 \
  | grep -o 'crop=[0-9:]*' | tail -1 || true)"
filters="${crop:+$crop,}scale=1280:-2:flags=lanczos,fps=25,format=yuv420p"
echo "Filters: $filters"

ffmpeg -hide_banner -y -ss "$start" -t "$duration" -i "$in" -an -vf "$filters" \
  -c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -movflags +faststart \
  "$out/hero.mp4"

ffmpeg -hide_banner -y -ss "$start" -t "$duration" -i "$in" -an -vf "$filters" \
  -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  "$out/hero.webm"

ffmpeg -hide_banner -y -i "$out/hero.mp4" -frames:v 1 -q:v 4 "$out/hero-poster.jpg"

ls -lh "$out"/hero.*
