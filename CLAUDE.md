# CLAUDE.md

Memoria de este repo. Se carga sola en cada sesión, aquí o en cualquier máquina.
Si algo de aquí choca con lo que te pide el usuario, gana el usuario — pero dilo.

## Qué es este repo

Monorepo de apps web independientes bajo `APPS/`, más el sistema de agentes que
las construye y verifica. Cada app es autónoma: no comparten build ni framework.

```
APPS/<NOMBRE>/          una app, normalmente HTML/CSS/JS vanilla sin build
APPS/<NOMBRE>/REQUISITOS.md   contrato de la app (salida del skill `intake`)
tests/<app>.spec.js     tests Playwright, uno por criterio de REQUISITOS.md
tests/server.mjs        servidor estático para los tests
.claude/agents/         builder, tester, reviewer
.claude/skills/         build-loop
.claude/hooks/          gate de tests + chequeo de sintaxis
```

## El flujo de trabajo

1. **`intake`** → entrevista al usuario. Su salida se escribe en
   `APPS/<APP>/REQUISITOS.md`. Nunca se queda solo en el chat.
2. **`build-loop`** → builder → tester → reviewer, en bucle hasta verde.
3. El hook de `Stop` corre `npm test`. **No se puede cerrar un turno en rojo.**

`refine-loop` sigue existiendo, pero solo para apps que aún no tienen
`REQUISITOS.md` ni tests. En cuanto los tengan, se usa `build-loop`.

## Comandos

```bash
npm install                               # una vez
npm test                                  # toda la suite (mobile + desktop)
npx playwright test tests/<app>.spec.js   # una app
npx playwright test -g "nombre del test"  # un test
npm run serve                             # servidor manual en :4173
```

Chromium ya está instalado en el contenedor (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
**No correr `playwright install`.** `playwright.config.js` apunta al binario
directamente porque la versión de `@playwright/test` no coincide con ese build.

## Convenciones

- **Editar lo que cambia.** No reescribir archivos enteros.
- **Leer el archivo completo antes de tocarlo.**
- Comentarios en el código solo cuando la razón no sea evidente — y entonces el
  **por qué**, no el qué.
- El nombre de cada `test(...)` es exactamente el de la columna *Test* de
  `REQUISITOS.md`. Si se renombra uno, se renombra el otro.
- Los tests no tocan la red. Analytics, fuentes y CDNs se cortan con
  `page.route(...).abort()`.
- Un test nuevo para un bug tiene que **fallar antes del arreglo**. Si pasa a la
  primera, está mal escrito.

## Errores que no se repiten

Cada línea aquí costó un bug real. Se añade una entrada cada vez que algo se
escapa hasta el usuario.

1. **Un hueco hacia adelante en el tiempo no es trampa.** `detectTimeTampering`
   marcaba cualquier salto de más de 48h entre guardados como manipulación del
   reloj. Un jugador que se ausenta unos días caía ahí. Solo el reloj yendo
   **hacia atrás** es manipulación. → `tests/secondguess.spec.js` C5.

2. **Toda pantalla de bloqueo necesita una salida que no dependa del usuario.**
   La vista de espera de SecondGuess nunca volvía a guardar datos, y el historial
   que causaba el bloqueo solo se limpiaba al guardar: encierro permanente, sin
   más salida que borrar el progreso. Al detectar el estado corrupto, límpialo.
   → C6.

3. **Un contador con objetivo en el pasado es una pantalla muerta.** Pintaba
   `00` fijo y el usuario no salía de ahí. Si el objetivo ya pasó, la acción
   correcta es dejar pasar al usuario. → C7.

4. **Días de calendario ≠ milisegundos / 86400000.** Jugar anteayer a las 23:59 y
   abrir hoy a las 09:00 son 33 horas: un solo "día" por división, pero un día
   completo saltado. Comparar fechas normalizadas a medianoche. → C11.

5. **Un test que pasa con el bug reintroducido no es un gate.** Pasó aquí: el
   arreglo de (3) enmascaraba el de (1), y el test seguía en verde con el bug
   puesto. Antes de dar un test por bueno, quita el arreglo y comprueba que se
   pone rojo. Si no se pone rojo, el test no prueba lo que crees.

## Lo que está asumido y no es un bug

- Los promedios de la multitud en SecondGuess son **simulados**
  (`simulatedAvg` / `simulatedDist`). No hay backend en v1.
- `APPS/` tiene proyectos en distinto grado de terminación. Solo SECONDGUESS
  tiene `REQUISITOS.md` y tests; los demás siguen sin red de seguridad.
