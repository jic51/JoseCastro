#!/usr/bin/env bash
# Gate de tests. Corre en el hook Stop.
# Sale con codigo 2 si la suite esta en rojo: eso impide cerrar el turno y
# devuelve la salida al modelo como feedback. Es la pieza que convierte
# "creo que esta listo" en "los tests dicen que esta listo".
set -uo pipefail

input=$(cat)

# Corta el bucle: si ya estamos dentro de un bloqueo de Stop, dejamos pasar.
case "$input" in
  *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
[ -f package.json ] || exit 0
[ -d node_modules ] || exit 0

if ! out=$(npm test --silent 2>&1); then
  {
    echo "GATE EN ROJO: la suite de tests falla. No cierres el turno."
    echo "Arregla el codigo (no los tests) y vuelve a correr 'npm test'."
    echo "---"
    printf '%s\n' "$out" | tail -40
  } >&2
  exit 2
fi

exit 0
