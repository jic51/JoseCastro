# Arrancar Acopio Basic por primera vez

**Nadie la ha ejecutado nunca.** Ni yo. Todo lo que está escrito son guardias
que, con la constante en `false`, no entran — así que la suite en verde dice que
**la versión de pago sigue intacta**, no que la básica funcione.

Esto lo comprueba. Unos diez minutos.

> **Hazlo en una hoja NUEVA.** No en la de OX Glass, y tampoco encima de
> `PRUEBA 1 CLIC`. Si algo sale mal, que no haya nada que recuperar.

---

## 1 · La hoja

Copia tu plantilla de Acopio como siempre (**Archivo → Hacer una copia**) y
llámala **ACOPIO BASIC**. Tiene que tener ya sus pestañas de datos: **la versión
básica no trae asistente de instalación.**

## 2 · Los dos archivos

**Extensiones → Apps Script.** Borra todo y pega:

- `Code_v3_fixed.gs` → en `Código.gs`
- `Index_v3_fixed.html` → en `Index`

Son los de siempre, **v12.75 · build 98a3b9db**.

## 3 · LA LÍNEA

En `Código.gs`, busca con Ctrl+F:

```
var ACOPIO_BASIC = false;
```

Cámbiala a:

```
var ACOPIO_BASIC = true;
```

**Eso es toda la versión gratis.** Una palabra.

## 4 · El manifiesto

⚙️ **Configuración del proyecto** → marca *«Mostrar el archivo de manifiesto
appsscript.json en el editor»*.

Vuelve al editor, abre `appsscript.json`, **borra todo** y pega
`appsscript.basic.json`.

Mira que quede **un solo permiso** y que diga `"access": "MYSELF"`.

Guarda 💾.

## 5 · Desplegar

**Implementar → Nueva implementación → App web**

- Ejecutar como: **Yo**
- Quién tiene acceso: **Solo yo** ← *distinto de la otra prueba, y es a propósito*

> **Por qué «Solo yo».** La versión básica no lleva usuarios: `userinfo.email` es
> uno de los permisos que hubo que quitar. Así que el portero es el despliegue —
> Google deja entrar sólo al dueño de la copia. Con *«cualquiera»*, quien tuviera
> el enlace escribiría en el inventario de otro.

Copia la dirección `/exec`.

## 6 · Abrirla

**📸 FOTO** de lo primero que salga.

Las tres cosas que hay que mirar, en orden:

| | Qué debería pasar | Si no pasa |
|---|---|---|
| **¿Abre?** | Entra directa al inventario, sin pedir iniciar sesión y sin asistente | es lo más probable que falle, y es el dato |
| **¿Qué falta?** | Sin pestaña *Incoming*, sin QR, sin etiquetas, sin usuarios, sin *Report issue* | |
| **¿Guarda?** | Un **Entry** se registra y aparece en el inventario | |

## 7 · La prueba que de verdad importa

Haz un **Entry** y luego **abre la hoja** y mira la fila en `ARCHIVE`.

**📸 FOTO de la fila entera**, con las columnas visibles.

Lo que hay que ver:

- Está **en las mismas columnas** que las filas de tu Acopio normal
- La columna del autor dice **`BASIC`** — no está vacía

> **Ésa es la promesa entera.** Si esa fila es idéntica en forma a las de Pro,
> alguien que empiece gratis y suba a Pro ve su historial completo el primer día,
> sin convertir nada. Si no lo es, hay que arreglarlo ahora y no cuando haya
> clientes.

## 8 · El teléfono

Mándate el `/exec` y ábrelo en el teléfono. Haz un movimiento desde ahí.

**📸 FOTO.**

---

## Lo que hay que mandarme

| | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Abrió sin pedir iniciar sesión? | sí / no |
| 2 | ¿Salió algún error? | **el texto entero, sin acortar** |
| 3 | ¿Guardó un Entry? | sí / no |
| 4 | ¿La fila está en las mismas columnas? | sí / no + foto |
| 5 | ¿Dice `BASIC` en el autor? | sí / no |
| 6 | ¿Funciona en el teléfono? | sí / no |

**Si sale un error rojo, cópialo entero.** El mensaje nombra la función exacta, y
eso vale más que diez suposiciones mías.

## Lo que ya sé que NO va a estar

Para que no lo cuentes como fallo:

- **No hay menú 🧪 ni ningún menú de Acopio en la hoja.** Es deliberado: el menú
  necesita el permiso que trae la pantalla fea. `onOpen` se calla a propósito.
- **No hay asistente de instalación.** La hoja ya viene hecha.
- Quedan **46 funciones** del censo sin apagar. Casi todas son del menú —que no
  existe— pero alguna puede asomar. Si una da error, dime cuál y la apago.
