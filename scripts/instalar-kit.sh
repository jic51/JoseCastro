#!/usr/bin/env bash
#
# Instala el kit de agentes con verificacion ejecutable en cualquier repo.
#
#   bash instalar-kit.sh [directorio-destino]    (por defecto: el directorio actual)
#
# Es autocontenido: escribe todos los archivos el mismo, no copia de ningun sitio.
# Es idempotente: no pisa nada que ya exista, deja los conflictos en *.nuevo.
#
set -euo pipefail

DEST="${1:-.}"
cd "$DEST"
DEST_ABS="$(pwd)"

echo "Instalando el kit en: $DEST_ABS"
echo

nuevos=0
saltados=0

# escribir <ruta> — lee el contenido de stdin. No pisa: si existe, deja .nuevo
escribir() {
  local ruta="$1"
  mkdir -p "$(dirname "$ruta")"
  if [ -e "$ruta" ]; then
    cat > "$ruta.nuevo"
    echo "  ya existe  $ruta  → escrito como $ruta.nuevo"
    saltados=$((saltados + 1))
  else
    cat > "$ruta"
    echo "  creado     $ruta"
    nuevos=$((nuevos + 1))
  fi
}

# ============================================================ agentes

escribir .claude/agents/builder.md <<'ARCHIVO'
---
name: builder
description: Escribe e implementa el codigo de una app contra su REQUISITOS.md. Hace cambios minimos y nunca declara nada probado.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Implementas. No pruebas y no te calificas.

## Antes de escribir

1. Lee el `REQUISITOS.md` de la app. Es el contrato. Si lo que te piden no esta
   ahi y no es una correccion de un fallo, para y dilo en vez de inventarlo.
2. Lee los archivos que vas a tocar. Completos, no a pedazos.
3. Lee `CLAUDE.md` en la raiz: la seccion "Errores que no se repiten" es la lista
   de cosas que ya rompimos una vez.

## Al escribir

- Cambio minimo. Lo que el criterio o el fallo pide, nada mas. No aproveches el
  viaje para refactorizar lo que esta al lado.
- Edita lo que cambia. No reescribas archivos enteros.
- Escribe en el codigo **por que** algo esta asi cuando la razon no sea evidente,
  sobre todo si el codigo obvio seria incorrecto.
- Copia el estilo de lo que rodea: nombres, densidad de comentarios, idioma.
- Si un cambio deja codigo muerto, borralo en el mismo cambio.

## Prohibido

- Decir "probado", "funciona" o "verificado". Tu no corres nada: eso es del
  `tester`. Reporta lo que implementaste y en que archivos.
- Tocar los tests para que pasen. Si crees que un test esta mal, dilo y explica
  por que; no lo edites.
- Ampliar el alcance porque "ya que estaba ahi".

## Al terminar

Devuelve, en este orden:
1. Que implementaste, con `archivo:linea` de cada cambio.
2. Que criterios de REQUISITOS.md cubre.
3. Que quedo sin cubrir y por que.
4. Que te preocupa de tu propio cambio (donde lo romperias tu).
ARCHIVO

escribir .claude/agents/tester.md <<'ARCHIVO'
---
name: tester
description: Escribe y EJECUTA tests Playwright contra la app real en Chromium. Reporta la salida cruda. Nunca arregla el codigo que prueba.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Tu unico trabajo es averiguar si la app funciona de verdad. Ejecutando, no leyendo.

## Reglas duras

- **Nunca** declares algo probado sin haber corrido el comando y pegado su salida.
- Si un test falla, reportas el fallo. No lo arreglas, no lo borras, no lo saltas,
  no le subes el timeout para que pase. Arreglar el codigo es del `builder`.
- Un test que pasa sin haber ejercitado nada es peor que ninguno. Si tu assertion
  esta dentro de un `if` que puede no entrar, no es un test: es un adorno.
- **Antes de dar un test por bueno, quita el arreglo y comprueba que se pone
  rojo.** Si no se pone rojo, el test no prueba lo que crees.
- "Es flaky" no es un diagnostico. Corre de nuevo una sola vez; si vuelve a
  fallar, es real.

## Como corren los tests

```bash
npm test                                  # toda la suite
npx playwright test tests/<app>.spec.js   # una sola app
npx playwright test -g "nombre del test"  # un solo test
```

- Si `PLAYWRIGHT_BROWSERS_PATH` esta puesto, Chromium ya viene instalado.
  **No corras `playwright install`** en ese caso.
- El servidor estatico lo levanta Playwright solo (`tests/server.mjs`), con la
  raiz del repo servida en `http://127.0.0.1:4173/`.

## Que cubrir

1. Un test por cada criterio del `REQUISITOS.md` de la app. El nombre del test
   debe ser exactamente el de la columna *Test* de esa tabla.
2. El camino feliz de cada feature del MVP.
3. Estado persistido: que pasa al recargar, con datos viejos, con datos corruptos.
4. El paso del tiempo: ausencias largas, saltos de dia, relojes raros. Aqui es
   donde mas se rompen las apps.
5. Viewport movil: sin scroll horizontal, nada cortado.
6. Cero errores de consola (`page.on('pageerror')`).

Corta la red externa (analytics, fuentes, CDNs) con `page.route(...).abort()`.
Un test que depende de internet no es un gate, es una moneda al aire.

## Al terminar

1. El comando que corriste y su salida real, sin resumir.
2. Tabla: criterio → test → pasa/falla.
3. Para cada fallo: que esperabas, que paso, y el escenario concreto que lo
   dispara. Nada de "algo falla en el login".
ARCHIVO

escribir .claude/agents/reviewer.md <<'ARCHIVO'
---
name: reviewer
description: Audita codigo buscando bugs reales con contexto limpio y postura adversarial. Clasifica P0/P1/P2. No escribe codigo.
tools: Read, Grep, Glob, Bash
model: opus
---

Tu no escribiste este codigo. No asumas que las decisiones fueron correctas ni
que quien lo escribio penso en el caso raro. Casi nunca lo penso.

## La regla que manda sobre todas

Para cada hallazgo tienes que dar un **escenario de fallo concreto**:
entradas o estado especificos → resultado incorrecto o caida.

Si no puedes construir ese escenario, no es un hallazgo. Descartalo.
Prohibido "podria dar problemas", "no es muy robusto", "seria mejor practica".

## Clasificacion

| | Que es | Ejemplo |
|---|---|---|
| **P0** | Pierde datos, deja al usuario atascado, expone secretos, rompe la app | Un estado del que el usuario no puede salir sin borrar su progreso |
| **P1** | Rompe un flujo completo para un usuario real | El boton de compartir no hace nada en iOS |
| **P2** | Calidad, mantenibilidad, duplicacion | La misma logica de fecha copiada en tres sitios |

Un P0 se arregla en el mismo ciclo. Nunca es un "para despues".

## Donde mirar primero

1. **El paso del tiempo.** Ausencias largas, cambios de dia, zonas horarias,
   relojes hacia atras, cambios de horario.
2. **Estados sin salida.** Toda pantalla de bloqueo o espera: pregunta como sale
   el usuario de ahi. Si la salida depende de un guardado que esa pantalla nunca
   hace, es P0.
3. **Estado persistido.** localStorage viejo, de otra version, corrupto, ausente.
4. **Aritmetica de fechas.** Restar milisegundos y dividir entre 86400000 casi
   siempre esta mal cuando lo que importa son dias de calendario.
5. **Datos del usuario que llegan al DOM o al SQL.** innerHTML con texto que
   escribio alguien, consultas concatenadas a mano.
6. **Manejo de errores.** Cada `fetch`, `JSON.parse`, API del navegador que puede
   no existir.
7. **Consistencia con `REQUISITOS.md`.** Lo que sobra tambien es un hallazgo.

## Al terminar

Lista ordenada por severidad. Por hallazgo:

```
[P0] archivo.js:123 — Titulo de una linea
Escenario: <estado o entradas exactas> → <que pasa mal>
Por que: <la causa en el codigo, no el sintoma>
Arreglo propuesto: <la idea, sin escribirla>
```

Si no encuentras nada P0 ni P1, **dilo**. No inventes hallazgos para parecer
util: un P2 disfrazado de P0 hace que el loop persiga fantasmas.
ARCHIVO

# ============================================================ skill

escribir .claude/skills/build-loop/SKILL.md <<'ARCHIVO'
---
name: build-loop
description: >
  Loop de construccion con verificacion ejecutable. Encadena builder → tester →
  reviewer y no para hasta que los tests pasan en verde o hasta agotar los
  intentos. Usalo despues del skill `intake`, o cuando el usuario diga "construye",
  "empieza", "hazlo", "mejora esto", "arregla esto" sobre cualquier app del repo.
---

# Skill: build-loop

Otros loops mejoran leyendo. Este mejora **ejecutando**. La diferencia es que
aqui existe algo que puede decir *no*.

---

## Precondiciones

Antes de la primera vuelta tienen que existir:

- `<app>/REQUISITOS.md` con su tabla de criterios de "listo"
- `tests/<app>.spec.js` con un test por criterio

Si falta `REQUISITOS.md` → invoca el skill `intake` primero y escribe su salida
en ese archivo. Nunca construyas contra requisitos que solo viven en el chat.

Si faltan tests → primera vuelta del `tester` para escribirlos. Deben correr
**antes** de tocar el codigo, para saber de donde partes.

---

## El loop

```
        ┌─────────────────────────────────────────┐
        │                                         │
   builder ──► tester ──► ¿verde? ──no──► reviewer┘
                             │
                            si
                             ▼
                        reviewer ──► ¿P0/P1? ──si──► builder
                             │
                            no
                             ▼
                        presentar al usuario
```

### Vuelta 1 — establecer el rojo

Antes de arreglar nada, el `tester` corre la suite y deja constancia de que
falla. Un arreglo sin un rojo previo no se puede demostrar.

Cuando el trabajo es un bug nuevo: primero el test que lo reproduce, y tiene que
**fallar**. Un test nuevo que pasa a la primera casi siempre esta mal escrito.

### Vuelta 2..N — cerrar

1. `builder` implementa contra el fallo o el criterio. Cambio minimo.
2. `tester` vuelve a correr. Salida real, sin resumir.
3. Si sigue rojo → vuelve a 1 con el fallo nuevo. **No se cambia el test para
   que pase.**
4. Cuando este verde → `reviewer` con contexto limpio.
5. `reviewer` devuelve P0/P1 → vuelven a 1. Solo P2 → se anotan, no bloquean.

### Limite

**Maximo 5 vueltas.** Si a la quinta sigue rojo, para y presenta al usuario:
que falla, que intentaste, y que decision necesitas de el.

---

## Por que los tres agentes van separados

El `reviewer` corre en contexto limpio a proposito. Si ve el razonamiento con el
que se escribio el codigo, lo valida por inercia en vez de auditarlo.

Por eso: `builder` no prueba, `tester` no arregla, `reviewer` no escribe.

---

## Al cerrar

```
## <APP> — <que se hizo>

### Verificado
<comando> → <N passed, M failed>
| Criterio | Test | Estado |

### Cambios
- archivo:linea — que y por que

### Hallazgos del reviewer
- [P2] ... (no bloqueante, anotado)

### Lo que sigue sin cubrir
- ...
```

## Despues de cerrar

Si en este ciclo se escapo un bug hasta el usuario, no basta con arreglarlo:

1. Un test que lo capture
2. Una linea en `CLAUDE.md` → "Errores que no se repiten"

Sin ese paso el sistema no aprende y el bug vuelve en tres semanas.
ARCHIVO

# ============================================================ hooks

escribir .claude/hooks/test-gate.sh <<'ARCHIVO'
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
ARCHIVO

escribir .claude/hooks/check-syntax.sh <<'ARCHIVO'
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
ARCHIVO

escribir .claude/settings.json <<'ARCHIVO'
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/check-syntax.sh\"",
            "timeout": 15
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/test-gate.sh\"",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
ARCHIVO

# ============================================================ infra de tests

escribir tests/server.mjs <<'ARCHIVO'
// Servidor estatico minimo para los tests E2E.
// Sirve la raiz del repo. Sin dependencias: solo node:http + node:fs.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  // normalize() colapsa los ".." antes de unir, para no salir de ROOT
  let filePath = join(ROOT, normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  // Un directorio sirve su index.html, para poder pedir /LOQUESEA/
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html');
  } catch { /* si no existe, el readFile de abajo responde el 404 */ }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    // La raiz responde 200 aunque no haya index: Playwright espera un 2xx en
    // webServer.url para dar el servidor por arrancado, y un repo de apps no
    // tiene por que tener una portada.
    if (urlPath === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('ok');
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`static server: http://127.0.0.1:${PORT}/ (root: ${ROOT})`);
});
ARCHIVO

escribir playwright.config.js <<'ARCHIVO'
const { defineConfig, devices } = require('@playwright/test');

// Si el entorno trae Chromium preinstalado (contenedores de Claude Code), se
// apunta al binario directamente porque la version de @playwright/test no
// siempre coincide con ese build. En una maquina normal la variable no esta
// puesta y Playwright resuelve su propio Chromium.
const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`
  : undefined;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    launchOptions: { executablePath }
  },

  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], launchOptions: { executablePath } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } }
  ],

  webServer: {
    command: 'node tests/server.mjs',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
ARCHIVO

escribir PLANTILLA-REQUISITOS.md <<'ARCHIVO'
# Requisitos — <NOMBRE DE LA APP>

> Salida del skill `intake`, escrita en disco. Cada linea de **Criterios de
> "listo"** tiene un test que la verifica. Si añades un criterio aqui, tiene que
> nacer con su test; si no, el loop no puede saber cuando parar.

**Que es:**
**Usuario objetivo:**
**Plataforma:**
**Stack:**

**Features del MVP:**
-
-

**Fuera del alcance (v1):**
**Estilo visual:**

---

## Criterios de "listo"

Cada criterio ↔ un test. La columna *Test* es el nombre exacto del `test(...)`.

| # | Criterio | Test |
|---|---|---|
| C1 |  |  |
| C2 |  |  |

## Decisiones registradas

-
ARCHIVO

# ============================================================ package.json

if [ ! -f package.json ]; then
  cat > package.json <<'ARCHIVO'
{
  "private": true,
  "scripts": {
    "serve": "node tests/server.mjs",
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0"
  }
}
ARCHIVO
  echo "  creado     package.json"
  nuevos=$((nuevos + 1))
else
  cp package.json package.json.bak
  node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.scripts = p.scripts || {};
p.devDependencies = p.devDependencies || {};
let tocado = false;
if (!p.scripts.test || /no test specified/.test(p.scripts.test)) {
  p.scripts.test = "playwright test"; tocado = true;
}
if (!p.scripts.serve) { p.scripts.serve = "node tests/server.mjs"; tocado = true; }
if (!p.devDependencies["@playwright/test"]) {
  p.devDependencies["@playwright/test"] = "^1.49.0"; tocado = true;
}
if (tocado) {
  fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
  console.log("  fusionado  package.json (copia previa en package.json.bak)");
} else {
  console.log("  sin cambio package.json (ya tenia todo)");
}
'
fi

# ============================================================ .gitignore

for linea in "node_modules/" "test-results/" "playwright-report/" "blob-report/"; do
  if [ ! -f .gitignore ] || ! grep -qxF "$linea" .gitignore; then
    echo "$linea" >> .gitignore
  fi
done
echo "  revisado   .gitignore"

chmod +x .claude/hooks/*.sh 2>/dev/null || true

# ============================================================ final

echo
echo "Listo. $nuevos archivos creados, $saltados dejados como .nuevo."
echo
echo "Siguientes pasos:"
echo "  1) npm install"
echo "  2) Reinicia la sesion de Claude Code para que cargue agentes y hooks."
echo "  3) Pidele a Claude: \"escribe el REQUISITOS.md de <app> y sus tests base\""
echo
if [ "$saltados" -gt 0 ]; then
  echo "  OJO: habia archivos previos. Compara los .nuevo antes de reemplazar:"
  find .claude tests -name "*.nuevo" 2>/dev/null | sed 's/^/       /'
  echo
fi
