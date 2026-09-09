#!/usr/bin/env bash
# Genera i fermi immagine dei video in public/images/poster/.
#
# Servono a ContentRow.astro: da quando i video non partono piu' al
# caricamento della pagina ma solo quando entrano nello schermo, il poster e'
# quello che riempie il riquadro nell'attesa — ed e' anche l'unica cosa che
# si vede se JavaScript non gira.
#
# La convenzione e' fissa e ContentRow ci conta sopra:
#   public/videos/<qualsiasi>/NOME.mp4  ->  public/images/poster/NOME.webp
#
# Va rilanciato quando si aggiunge un video a una ContentRow o se ne
# sostituisce uno esistente. Richiede ffmpeg nel PATH.
#
#   ./scripts/genera-poster.sh
set -euo pipefail
cd "$(dirname "$0")/.."

command -v ffmpeg >/dev/null || { echo "Serve ffmpeg nel PATH."; exit 1; }

mkdir -p public/images/poster

# I video davvero referenziati dalle pagine, non tutto public/videos/ (che
# contiene anche materiale non usato).
mapfile -t VIDEO < <(grep -rhoE '/videos/[A-Za-z0-9._/\\-]+\.mp4' src/ \
  | sed 's/\\//g' | sort -u)

for v in "${VIDEO[@]}"; do
  [ -f "public$v" ] || { echo "manca  public$v (referenziato ma assente)"; continue; }
  nome=$(basename "$v" .mp4)
  out="public/images/poster/$nome.webp"
  # -ss 1.5: il primo fotogramma e' spesso nero o sfocato dall'apertura.
  ffmpeg -y -hide_banner -loglevel error -ss 1.5 -i "public$v" -frames:v 1 \
    -vf "scale='min(1080,iw)':-2" -q:v 80 "$out"
  printf '%6s KB  %s\n' "$(( $(stat -c%s "$out") / 1024 ))" "$out"
done
