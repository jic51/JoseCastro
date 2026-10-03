---
name: build-loop
description: >
  Loop de construccion con verificacion ejecutable. Encadena builder → tester →
  reviewer y no para hasta que los tests pasan en verde o hasta agotar los
  intentos. Usalo despues del skill `intake`, o cuando el usuario diga "construye",
  "empieza", "hazlo", "mejora esto", "arregla esto" sobre cualquier app de APPS/.
  Sustituye a `refine-loop` cuando la app ya tiene REQUISITOS.md y tests.
---

# Skill: build-loop

`refine-loop` mejora leyendo. Este mejora **ejecutando**. La diferencia es que
aqui existe algo que puede decir *no*.

---

## Precondiciones

Antes de la primera vuelta tienen que existir:

- `APPS/<APP>/REQUISITOS.md` con su tabla de criterios de "listo"
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
que falla, que intentaste, y que decision necesitas de el. Seguir dando vueltas
sin cambiar de hipotesis es la forma cara de no avanzar.

---

## Por que los tres agentes van separados

El `reviewer` corre en contexto limpio a proposito. Si ve el razonamiento con el
que se escribio el codigo, lo valida por inercia en vez de auditarlo. El mismo
modelo, sin ese contexto, encuentra cosas que con el contexto no ve.

Por eso: `builder` no prueba, `tester` no arregla, `reviewer` no escribe.

---

## Al cerrar

El hook de `Stop` corre `npm test` de todas formas, asi que no se puede cerrar
en rojo aunque se te olvide. No dependas de eso: corre la suite tu.

Presenta asi:

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

1. Un test que lo capture, en `tests/<app>.spec.js`
2. Una linea en `CLAUDE.md` → "Errores que no se repiten"

Sin ese paso el sistema no aprende y el bug vuelve en tres semanas.
