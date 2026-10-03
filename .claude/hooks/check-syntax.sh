#!/usr/bin/env bash
# Comprobacion de sintaxis inmediata despues de cada Edit/Write sobre un .js
# Barato (milisegundos) y atrapa el error mas tonto antes de que llegue al gate.
set -uo pipefail

input=$(cat)

file=$(printf '%s' "$input" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  try { process.stdout.write(JSON.parse(s).tool_input?.file_path ?? ""); }
  catch { process.stdout.write(""); }
});
' 2>/dev/null)

case "$file" in
  *.js|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

if ! err=$(node --check "$file" 2>&1); then
  printf 'Error de sintaxis en %s:\n%s\n' "$file" "$err" >&2
  exit 2
fi

exit 0
