# Concurrencia — qué pasa cuando dos personas guardan a la vez

Resultado de la prueba que Jose puso primera en la lista.
Ejecutable: `node tools/test-concurrency.js`

---

## La respuesta corta

**Guardar movimientos —lo que más se hace y lo más peligroso— está bien
protegido.** Ese camino ya estaba pensado para esto y está bien hecho.

**Hay siete caminos más que también cambian el stock y NO están protegidos.**
Ninguno es tan frecuente como guardar un movimiento, pero varios son cosas que
un admin hace en un día normal, y el daño sería silencioso.

Nada de esto se ha probado todavía con gente real al mismo tiempo. Esta prueba
acota dónde mirar.

---

## Lo que sí está protegido

| Camino | Candado |
|---|---|
| `addMovementsBatch_` — guardar movimientos | `waitLock(8000)` |
| `archiveOldMovements` — mover filas viejas | `tryLock(10000)` |

Y está bien hecho, en tres detalles que suelen fallar:

1. **La lectura ocurre DENTRO del candado.** Si el archive se leyera antes,
   el candado sería decorativo: dos ejecuciones leerían el mismo "antes" y
   luego se turnarían para escribir, y la segunda igual pisaría a la primera.
2. **Se libera en un `finally`.** Un error de validación no puede dejar el
   candado tomado y a todos los demás afuera.
3. **Los dos casos fallan distinto, y es correcto.** Guardar un movimiento
   falla **ruidosamente** ("System busy — please retry") porque hay una
   persona esperando; el archivado de fondo se rinde en silencio y lo intenta
   después, porque no hay nadie mirando.

## Los siete caminos sin candado

Ordenados por riesgo real, no por gravedad teórica:

| Camino | Qué hace | Qué tan seguido |
|---|---|---|
| `modifyMovement` | Editar un movimiento guardado (cantidad, categoría, nombre — todo cambia el stock) | **Un admin, cualquier día** |
| `updateConfig` | **Renombrar una categoría reescribe la celda Categoría de CADA fila del archive** | Ocasional, y toca todo |
| `manageMaterial` | Renombrar / fusionar / borrar un material — reescribe muchas filas | Ocasional |
| `mergeConfigValues` | Fusionar categorías o proyectos | Poco frecuente |
| `mergeLocations` | Fusionar ubicaciones | Poco frecuente |
| `refreshDerivedSheets_` | Reescribe LIVE_STOCK / SITE_STOCK / WASTED_STOCK | **Constante** (pero ver abajo) |
| `menuNormalizeStatus` | Limpieza única del Status desde el menú | Rarísimo, lo corre el dueño |

**`updateConfig` lo encontró la prueba, no yo leyendo el código.** Al revisar
a mano lo di por inocente porque parece un cambio de configuración; lo que
hace en realidad es recorrer el archive completo reescribiendo celdas. Es
justo la clase de cosa que un par de ojos pasa por alto y un test no.

### El caso peligroso, en concreto

Un admin corrige un movimiento de ayer mientras alguien en bodega registra una
salida. Los dos leen el estado, los dos escriben. **No hay error, no hay
aviso, los dos ven "guardado ✓"** — y el número queda mal hasta que alguien
vaya a contar físicamente. Ese silencio es el problema, no la colisión.

### Un matiz importante sobre `refreshDerivedSheets_`

Se llama **desde dentro** de `addMovementsBatch_`, que ya tiene el candado. O
sea que en el camino más frecuente **sí está protegido**. El riesgo está en
las otras cuatro llamadas, fuera del guardado.

Y esto condiciona el arreglo: **no se le puede poner un `waitLock` normal o se
bloquearía a sí mismo.** Hace falta un candado reentrante.

---

## El arreglo propuesto — sin construir, esperando aprobación

Un solo ayudante, reentrante, y que todos los caminos lo usen:

```javascript
var _archiveLockDepth = 0;   // por ejecución: Apps Script aísla cada request

function withArchiveLock_(fn) {
  if (_archiveLockDepth > 0) {            // ya lo tenemos en esta ejecución
    _archiveLockDepth++;
    try { return fn(); } finally { _archiveLockDepth--; }
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    throw new Error('System busy — someone else is saving right now. Try again in a moment.');
  }
  _archiveLockDepth++;
  try { return fn(); }
  finally { _archiveLockDepth--; try { lock.releaseLock(); } catch (e) {} }
}
```

Y migrar **también** `addMovementsBatch_` y `archiveOldMovements` a usarlo, para
que toda toma de candado pase por un solo lugar y la reentrancia se lleve la
cuenta de forma consistente. Si `addMovementsBatch_` sigue usando
`LockService` directo, `refreshDerivedSheets_` no sabría que ya está tomado.

**Riesgo del arreglo, honestamente:** toca el camino más crítico del producto
(guardar movimientos). Un error ahí es peor que el problema que resuelve. Por
eso está propuesto y no hecho.

**Orden sugerido, del más valioso al menos:**
1. `modifyMovement` y `updateConfig` — los dos que un admin toca de verdad
2. `manageMaterial`, `mergeConfigValues`, `mergeLocations`
3. `refreshDerivedSheets_` (necesita la reentrancia, por eso va después)
4. `menuNormalizeStatus` — casi simbólico

---

## Lo que esta prueba NO demuestra

Importante, después de lo que pasó con el favicon:

- **Parte 1** es un hecho sobre el código fuente: quién toma el candado.
  Eso es verificable y está verificado.
- **Parte 2** es un **modelo** del mecanismo (lectura-modificación-escritura
  con y sin candado). No ejecuta `addMovementsBatch_` — eso necesita Sheets de
  verdad. Demuestra el mecanismo, no el producto.
- **Ninguna de las dos** demuestra que una instalación real aguante cuatro
  personas trabajando a la vez.

Eso sigue necesitando una prueba en vivo: una copia desplegada, tres o cuatro
navegadores, todos guardando movimientos del mismo material al mismo tiempo, y
después contar a mano. Es la prueba que falta, y ahora al menos se sabe qué
mirar.
