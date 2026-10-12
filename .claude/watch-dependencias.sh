#!/usr/bin/env bash
#
# LAS DEPENDENCIAS DE /watch, QUE NO VIVEN EN GIT.
#
# La skill (.claude/skills/watch/) sí está en el repositorio, así que llega sola
# a cualquier sesión. Lo que NO llega son los tres programas que necesita:
# ffmpeg, ffprobe y yt-dlp. Esos se instalan en el contenedor, y el contenedor
# de una sesión en la nube se borra cuando la sesión termina.
#
# O sea: la skill está siempre; sus herramientas hay que volver a poner una vez
# por sesión. Eso es este archivo.
#
#   bash .claude/watch-dependencias.sh
#
# Tarda alrededor de un minuto. Si ya están puestas, no hace nada y lo dice.
#
# Medido el 2026-10-09 en el contenedor de Claude Code en la web:
#   ffmpeg 6.1.1 por apt, yt-dlp 2026.08.19 por pip. Python 3.11.15 ya venía.
#
# ─── UNA ADVERTENCIA QUE NO ES OBVIA ─────────────────────────────────────────
#
# `apt-get install` falla con un montón de 404 si no se corre `apt-get update`
# antes. No es que falte el paquete: es que el índice que trae la imagen apunta
# a versiones que ya se retiraron del archivo de Ubuntu. Por eso el update está
# aquí dentro y no es opcional.
#
set -u

echo "── /watch · dependencias ──────────────────────────────────────────────"

falta=0
for prog in ffmpeg ffprobe yt-dlp; do
  if command -v "$prog" >/dev/null 2>&1; then
    # yt-dlp usa --version; ffmpeg y ffprobe usan -version. Preguntar mal no da
    # error: da una línea VACÍA, que se lee como "está pero no sé cuál es" —
    # peor que no decir nada.
    if [ "$prog" = "yt-dlp" ]; then v=$(yt-dlp --version 2>/dev/null | head -1)
    else                           v=$("$prog" -version 2>/dev/null | head -1)
    fi
    echo "  ya está   $prog  ($(echo "$v" | cut -c1-58))"
  else
    echo "  FALTA     $prog"
    falta=1
  fi
done

if [ "$falta" -eq 0 ]; then
  echo
  echo "  Nada que hacer. Comprobación de la propia skill:"
  python3 "$(dirname "$0")/skills/watch/scripts/setup.py" --check && echo "  ✓ lista para usar"
  exit 0
fi

echo
echo "── instalando (un minuto más o menos) ─────────────────────────────────"

# El update NO es opcional: ver la advertencia de arriba.
apt-get update -qq 2>&1 | grep -v "^W: Failed to fetch https://ppa\." | tail -2

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "  · ffmpeg + ffprobe…"
  apt-get install -y --no-install-recommends ffmpeg 2>&1 | tail -1
fi

if ! command -v yt-dlp >/dev/null 2>&1; then
  # --break-system-packages porque el contenedor marca su Python como
  # gestionado por el sistema (PEP 668). Es un contenedor desechable, así que
  # no hay nada que romper que no se vaya a borrar igualmente.
  echo "  · yt-dlp…"
  python3 -m pip install --quiet --break-system-packages "yt-dlp[default]" 2>&1 | grep -v "^WARNING: Running pip as" | tail -1
fi

echo
echo "── resultado ──────────────────────────────────────────────────────────"
for prog in ffmpeg ffprobe yt-dlp; do
  if command -v "$prog" >/dev/null 2>&1; then
    echo "  ✓ $prog"
  else
    echo "  ✗ $prog  — NO se pudo instalar"
  fi
done

# Y la configuración de la skill, que vive en ~/.config/watch/.env y también se
# borra con el contenedor. Sin esto, la skill cree que es su primera vez y
# vuelve a preguntar las preferencias.
#
# `local` y `none` a propósito, y se puede cambiar por llamada:
#   · `local`  = fotogramas y transcripción en esta máquina, sin clave, sin
#     mandar el vídeo a ningún sitio. Para poner Gemini hay que escribir una
#     GEMINI_API_KEY en ~/.config/watch/.env — y eso sube el vídeo a Google.
#   · `none`   = sin transcripción de voz. WhisperX descarga 1,5 GB que se
#     borran con el contenedor, así que pagarlo cada sesión no sale a cuenta.
#     Para una vez: --whisper groq  (necesita GROQ_API_KEY).
mkdir -p "$HOME/.config/watch"
if ! grep -q 'SETUP_COMPLETE' "$HOME/.config/watch/.env" 2>/dev/null; then
  echo
  echo "  · configuración de la skill (motor local, sin transcripción de voz)"
  python3 "$(dirname "$0")/skills/watch/scripts/setup.py" --engine local  >/dev/null 2>&1
  python3 "$(dirname "$0")/skills/watch/scripts/setup.py" --backend none --detail balanced >/dev/null 2>&1
fi

echo
python3 "$(dirname "$0")/skills/watch/scripts/setup.py" --check \
  && echo "  ✓ /watch lista para usar" \
  || echo "  ✗ la skill sigue sin poder arrancar — corre setup.py --json para ver por qué"
