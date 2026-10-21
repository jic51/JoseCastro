# ESTADO DE ACOPIO — dónde vamos

> Pedido por Jose el 21/10: *"actualiza el estado de Acopio para revisarlo cada
> vez que olvide cómo vamos, y señala las partes que estamos trabajando, las que
> recién hicimos y las no se han verificado, para enfocarme en ellas."*
>
> **Este documento se actualiza en cada versión.** Si la fecha de abajo tiene más
> de una semana, está viejo y hay que decirlo.

**Última actualización:** 21/10/2026 · **versión v12.84** · build `502c1a66`

---

## 🔴 LO QUE TE TOCA A TI — nada de esto avanza sin Jose

Esta es la lista corta, y es la que importa. Todo lo demás de este documento es
contexto.

| # | Qué | Por qué está parado | Cuánto cuesta |
|---|---|---|---|
| 1 | **Verificar la v12.82–84 en la app de verdad** | Está publicado y nadie lo ha abierto todavía | 10 min |
| 2 | **Que alguien de fuera instale la Básica** | El enlace `/copy` le falló a la única persona que lo intentó | 20 min, con otra persona |
| 3 | **Grabar V1, el vídeo del cronómetro** | Es el hueco más caro de la landing | una mañana |
| 4 | **Decidir el precio de la Básica en la página** | El precio de Pro ya está decidido; la columna de la gratis no | 10 min de decisión |
| 5 | **Una forma de agendar una llamada** | Hoy el camino muere en un correo | 20 min de configuración |

---

## ✅ LO QUE ACABAMOS DE HACER — y qué hay que mirar de cada cosa

### v12.84 · Devolver más de lo que salió, avisado · **SIN VERIFICAR**

Si devuelves más de lo que consta fuera en ese sitio, la app pregunta antes de
guardar. Si el material **no tiene ninguna salida registrada**, se guarda sin
decir nada — porque la historia de una bodega empieza a mitad.

**Qué probar:** abre un RETURN, elige de la lista un material con 7 fuera,
escribe 10, guarda. Tiene que preguntar. Después escribe un material inventado
con cantidad 99: **no tiene que decir nada**.

### v12.83 · Las listas de dependencias a mano, cerradas · **interno, nada que ver**

Quince de nuestras pruebas dejaron de mantener a mano la lista de lo que
necesitan de la app. No se ve desde fuera. Vino con un arreglo que sí: la lista
de jefes de obra ya no puede romper la pantalla de entrada.

### v12.82 · El RETURN parte de lo que está fuera · **SIN VERIFICAR**

Lo que pediste con las cuatro capturas. Al entrar en el nombre en una
devolución sale la lista de lo que está fuera de bodega, por **material y
lugar**, y al elegir una fila se rellena el formulario.

**Qué probar:**
1. Abrir Return → entrar en el nombre **sin escribir nada** → tiene que salir la
   lista sola.
2. Que un material en dos obras salga en **dos líneas**, no sumado.
3. Elegir una → nombre, sitio, cantidad, unidad, obra y PM puestos; el estante y
   el motivo vacíos, con el cursor ya en el estante.
4. Que **«Returned By» se quede vacío** — es a propósito.

### v12.81 · La ✕ en cada campo · **SIN VERIFICAR del todo**

Falta mirar una cosa concreta: **la ✕ dentro de una ventana modal**. En la tabla
y en los filtros está comprobada; dentro del formulario de movimientos, no.

### v12.80 · Las columnas dejan de moverse · **SIN VERIFICAR**

Era la barra de desplazamiento, no la tabla. **Qué probar:** cambiar de
categoría y de estado en el Dashboard varias veces y mirar si las columnas se
quedan quietas. Es lo que enseñaste en el vídeo del 20/10.

### v12.79 · El mazo de tarjetas · **verificado por Jose, con reserva**

Dijiste que *"ahora se ve mejor, pero eso no quiere decir que se vea
profesional"*. Queda tu idea: que la tarjeta que entra se vea **entrando en el
hueco**, y que la que se borra **tarde un poco más**.

---

## 🔶 LO QUE ESTAMOS TRABAJANDO AHORA

### 1. La tarjeta de ajuste por material que volvió sin haber salido

**Decidido por ti el 21/10, a medio construir.**

Hecho: el aviso antes de guardar (v12.84).

Falta, y es tu diseño: que el excedente quede **escrito en la fila**, que se cree
una **tarjeta que no se puede eliminar** pidiendo el ajuste, y que al hacer otra
salida de ese material se avise del excedente.

Mis añadidos a tu idea están en `BACKLOG.md`. El que más importa: **la tarjeta
tiene que calcularse, no guardarse** — si se guarda, el día que alguien arregle
el dato por otro camino la tarjeta se queda ahí señalando algo que ya no pasa.

### 2. La versión Básica — construida, **sin estrenar fuera**

Funciona y la has revisado tú. Lo que no ha pasado nunca: que **alguien que no
seas tú la instale de principio a fin**. El único intento falló al hacer la
copia de la hoja.

**Lo primero que hay que mirar:** que la hoja esté compartida como *Cualquiera
con el enlace → Lector*.

### 3. La landing — lo que falta para que venda

| | Estado |
|---|---|
| Página y textos | ✅ publicada, en dos idiomas |
| Imagen para compartir | ✅ se genera con un comando |
| **Vídeos e imágenes** | ❌ **ninguno existe** — las cuatro guías están en `CAPTURAS-PARA-LA-LANDING.md` |
| **Precios a la vista** | ❌ decididos en `PRECIOS-Y-COMPETENCIA.md`, no publicados |
| **Sección de Pro** | ❌ el candado de la app apunta a la raíz porque no hay dónde apuntar |
| **Agendar una llamada** | ❌ hoy muere en un correo |
| Testimonios | ⏸ **a propósito vacío** hasta que haya clientes de verdad |

---

## ❌ LO QUE NO SE HA VERIFICADO NUNCA — ordenado por riesgo

Esta es la sección que pediste, y está ordenada por **lo que más daño haría si
está mal**.

| | Qué no se ha probado | Qué pasaría si falla |
|---|---|---|
| 🔴 | **Migrar un Excel real** | Es el primer paso de todo cliente nuevo. Nunca se ha hecho ni una vez |
| 🔴 | **Una instalación completa por otra persona** | Si no se puede instalar sin ti, no hay producto que vender |
| 🔴 | **Tres o cuatro personas guardando a la vez** | Es donde las hojas de cálculo rompen datos, antes que por lentitud |
| 🟠 | **El techo de los 6 minutos con un archivo grande** | La prueba dice el techo en llamadas, pero **sin calibrar**: falta medirlo una vez en la instalación real |
| 🟠 | **Restaurar un backup de verdad** | Se crean todas las noches. Nunca se ha restaurado uno |
| 🟠 | **La app en un teléfono, trabajando de verdad** | Se ha mirado, no se ha usado un día entero en la bodega |
| 🟡 | **El lector de correos con facturas reales** | Funciona con las de prueba |
| 🟡 | **Qué pasa al llegar al límite de la hoja** | Está escrito en `CUANDO-SE-LLENE-EL-SHEET.md`, no probado |

---

## 🧱 LO QUE EXISTE Y FUNCIONA

Para no perder de vista el tamaño de lo que ya hay.

- Entradas, salidas, traslados, devoluciones, mermas y ajustes
- Mapa de la bodega por estantes, con fotos
- Panel con gráficas, mínimos y avisos de stock
- Vista por proyecto, con costos
- Entregas esperadas, y la entrada que se rellena sola desde una entrega
- Reservas de material
- Usuarios, roles y permisos
- Etiquetas con código, y lectura por foto
- Lector de correos con IA para facturas
- Backup automático cada noche, y archivado de lo viejo
- Informe diario por correo
- Informe de calidad de datos, con reparaciones
- **171 comprobaciones automáticas**, todas en verde

---

## 📋 LO SIGUIENTE, EN ORDEN

1. **Verificar la v12.82–84** (10 min, tú)
2. **Terminar la tarjeta de ajuste** (yo, ~1 versión)
3. **Precios y sección de Pro en la página** (medio día, yo; la decisión, tú)
4. **Agendar llamadas** (20 min, tú)
5. **Grabar V1, el cronómetro** (una mañana, tú)
6. **Que alguien de fuera instale la Básica** (20 min, tú y otra persona)
7. Las mejoras visuales de la siguiente versión: bloque de marca, pestañas
   centradas, **menú de iconos abajo en el teléfono**
8. Migrar un Excel real — el primero

---

## Dónde está cada cosa

| Pregunta | Documento |
|---|---|
| Qué falta y por qué | `BACKLOG.md` |
| Cuánto cobrar | `PRECIOS-Y-COMPETENCIA.md` |
| Qué grabar y cómo | `CAPTURAS-PARA-LA-LANDING.md` |
| Cómo instalar a un cliente | `RUNBOOK-INSTALACION.md` |
| Qué es la versión Básica | `VERSION-BASICA.md` |
| Cómo comprobar que funciona | `COMO-COMPROBAR-QUE-FUNCIONA.md` |
| Qué hacer antes de vender | `ANTES-DE-VENDER.md` |
