# Requisitos — SecondGuess

> Este documento es la salida del skill `intake`, escrita en disco en lugar de
> quedarse en el chat. Cada linea de **Criterios de "listo"** tiene un test que la
> verifica en `tests/secondguess.spec.js`. Si añades un criterio aquí, tiene que
> nacer con su test; si no, el loop no puede saber cuándo parar.

**Qué es:** juego diario de psicología social. El jugador no busca la respuesta
correcta, busca la respuesta que dará la mayoría.

**Usuario objetivo:** público general, principalmente en móvil.

**Plataforma:** PWA. Web instalable, funciona en Android e iOS sin App Store.

**Stack:** HTML/CSS/JS vanilla, sin build. Service worker para instalación offline.
Estado en `localStorage` con verificación de integridad por hash.

**Features del MVP:**
- Una pregunta por día (numérica o de opción múltiple), derivada de la fecha
- Cálculo de precisión contra un promedio simulado + puntos
- Racha diaria que se rompe al saltarse un día
- Tarjeta de resultados compartible (WhatsApp, X, Facebook, SMS, email, PNG)
- Bilingüe ES/EN
- Clasificación simulada, cacheada por día

**Fuera del alcance (v1):** backend real, cuentas de usuario, promedios reales de
jugadores reales, notificaciones push.

**Estilo visual:** oscuro, acento ámbar (`#f59e0b`), mobile-first.

---

## Criterios de "listo"

Cada criterio ↔ un test. La columna *Test* es el nombre exacto del `test(...)`.

| # | Criterio | Test |
|---|---|---|
| C1 | El onboarding de 3 pasos se completa y deja al jugador en la pregunta del día | `onboarding de 3 pasos lleva a la pregunta del dia` |
| C2 | La pregunta del día se renderiza y el botón de enviar arranca deshabilitado | `la pregunta del dia se renderiza con el submit deshabilitado` |
| C3 | Responder habilita el envío y produce una pantalla de resultados con precisión | `responder produce una pantalla de resultados` |
| C4 | Al recargar el mismo día se ven los resultados, no la pregunta otra vez | `al recargar el mismo dia se ven los resultados` |
| C5 | **Ausentarse varios días no bloquea al jugador.** Vuelve y puede jugar | `una ausencia larga no bloquea al jugador` |
| C6 | Si el reloj del dispositivo va hacia atrás, el bloqueo se cura solo | `el reloj hacia atras no deja al jugador bloqueado para siempre` |
| C7 | La pantalla de espera nunca muestra un contador ya vencido | `la pantalla de espera nunca muestra un contador vencido` |
| C8 | La racha se rompe si el jugador se salta un día completo | `la racha se rompe al saltarse un dia` |
| C9 | Datos corruptos en localStorage no rompen la app | `datos corruptos no rompen la app` |
| C10 | En móvil no hay scroll horizontal | `en movil no hay scroll horizontal` |

## Decisiones registradas

- **C5 y C6 nacieron de un bug real**, no de una idea de producto. El detector de
  trampas trataba cualquier salto de más de 48h como manipulación del reloj, y la
  pantalla de bloqueo nunca volvía a guardar datos, así que el jugador quedaba
  encerrado de forma permanente. Ver `CLAUDE.md` → "Errores que no se repiten".
- El promedio de la multitud es **simulado** (`simulatedAvg` / `simulatedDist`).
  Está asumido en v1 y los tests no deben esperar promedios reales.
