# Antes de vender — lista priorizada

Qué falta antes de cobrarle a la primera persona. Ordenado por riesgo real,
no por esfuerzo.

---

## Bloqueantes — no se vende sin esto

### 1. ~~Política de Privacidad desactualizada~~ ✅ HECHO (v9.96)

v9.77 agregó el check-in automático (correo a `SUPPORT_EMAIL` con nombre de
empresa, correo del admin y conteos) mientras la política, en sus dos copias,
seguía diciendo que no recibimos nada. Corregido en `legal/PRIVACY-POLICY.md`
y en la copia dentro de la app, y `tools/test-legal-sync.js` impide que las
dos vuelvan a divergir.

### 2. Plantilla maestra limpia — acción de Jose

Herramientas listas desde v9.30 (Advanced → Erase everything / Check if
clean). Falta lo que solo Jose puede hacer: renombrar el proyecto de Apps
Script, compartir como Viewer, generar el link `/copy`, y **copiarla él mismo
una vez para ver lo que ve un cliente**. Ver `docs/MASTER-TEMPLATE.md`.

### 3. Probar una restauración de backup, de principio a fin

**Nunca se ha hecho.** El procedimiento está escrito y auditado contra el
código en `docs/RESTAURAR-UN-BACKUP.md`, y ya reveló un hallazgo serio: el
backup copia la hoja, pero **las Script Properties no viven en la hoja**, así
que una restauración recupera todos los datos y **ninguna** de la
configuración — incluido `FOLDER_PREFIX`, sin el cual **todos los adjuntos
dejan de abrir**.

Hacerlo una vez en una copia de prueba. Un backup que nunca se restauró no es
un backup.

### 4. acopio.com y la página de novedades

Sin landing no hay a dónde mandar a nadie, y bloquea también el hipervínculo
del nombre "Acopio" dentro de la app y la tarjeta de reenganche. Ver
`docs/LANDING.md`.

### 5. Verificar que el consent screen esté "In production"

Un cliente OAuth en modo **Testing** limita a 100 usuarios y **las
autorizaciones caducan a los 7 días** — el login externo se rompería solo cada
semana. Acopio solo pide scopes básicos (`email`, `profile`), que se pueden
publicar sin verificación de Google. Es un interruptor, no un trámite: Cloud
Console → OAuth consent screen → confirmar **"In production"**. Detalle en
`docs/PLAN-5-ANIOS.md`.

### 6. Cómo se cobra

Ni decidido ni construido. Para los primeros clientes, factura manual está
bien — pero hay que decidir el mecanismo y que la instalación no dependa de
que Jose recuerde cobrar.

---

## Importantes — no bloquean la primera venta, sí la décima

### 7. Prueba de concurrencia

Lo que la literatura señala como el punto de quiebre de las hojas de cálculo
como inventario **no es el rendimiento, son los conflictos de edición
simultánea**. Acopio escribe desde el servidor y no desde la hoja, lo que
ayuda mucho, pero nadie ha probado 3–4 personas guardando movimientos a la
vez. Es exactamente lo que hace una bodega en la mañana.

### 8. Límite de 6 minutos por ejecución

Una importación grande o una reconstrucción de stock podría chocar contra el
techo de Apps Script. No probado. El motor de stock ya se midió y es lineal
(`tools/test-scale.js`), así que el sospechoso es la lectura/escritura de
Sheets, no el cálculo.

### 9. Onboarding manual por cliente

El paso de OAuth en Cloud Console (~5 min) es tolerable con 5 clientes y
molesto con 50. Las alternativas están evaluadas en `BACKLOG.md` (sección
*"Open decision — external sign-in for customers"*). No hace falta resolverlo
para vender; sí para crecer.

### 10. Conteo cíclico (cycle count)

Diseñado en `BACKLOG.md`, sin construir. Todo sistema de inventario serio lo
tiene, y es la primera pregunta de un comprador con experiencia.

### 11. Códigos de barras / QR + etiquetas

Igual que arriba: es de las primeras cosas que pregunta un jefe de bodega.

---

## Menores — se pueden vender sin esto y arreglar después

- Columna de costo en el CSV y editar el costo de un movimiento ya guardado
- Visor de PDF real (necesita PDF.js)
- Sincronización entre ventanas abiertas (diseño ya decidido en `BACKLOG.md`)
- Pase de pulido: scrollbars, animaciones, feedback instantáneo en Materials
  to Receive
- Menú hamburguesa en pantallas pequeñas
- Iconos profesionales y logo definitivo

---

## Orden sugerido

1. Política de Privacidad ✅
2. **Verificar "In production" en el consent screen** — es un interruptor y
   evita que el login externo caduque solo cada 7 días
3. Restaurar un backup de prueba **(lo más barato y de mayor riesgo real)**
4. Prueba de escala ✅ — motor medido y lineal; falta la parte de Sheets
5. Plantilla maestra limpia
6. Landing + página de novedades
7. Decidir el cobro
8. Prueba de concurrencia
9. Conteo cíclico y códigos de barras (esto ya es producto, no lanzamiento)

Los tres primeros son baratos y son riesgo real si un cliente los descubre
antes que nosotros.
