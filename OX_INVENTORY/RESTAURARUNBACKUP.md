# Restaurar un backup — procedimiento, y lo que el backup NO trae

> **Estado: el procedimiento está escrito y auditado contra el código. NADIE
> lo ha ejecutado todavía de principio a fin en una instalación real.**
> Hacerlo una vez, en una copia de prueba, es la tarea pendiente más
> importante antes de vender. Un backup que nunca se restauró no es un
> backup; es un archivo.

---

## El hallazgo que hay que conocer antes de necesitarlo

**El backup es una copia del Google Sheet. Las Script Properties NO viven en
el Sheet — viven en el proyecto de Apps Script.** Cuando Google copia una
hoja con un script adjunto, crea un proyecto de script NUEVO, y ese proyecto
nace con las Script Properties **vacías**.

Consecuencia: los DATOS se restauran completos, la CONFIGURACIÓN no.

### Lo que SÍ vuelve (está dentro de la hoja)

- Todos los movimientos (`MASTER_ARCHIVE_V3`) y el historial archivado
- La lista de usuarios y sus roles (`USERS_V3`)
- Categorías, proyectos, proveedores, ubicaciones, unidades, mínimos y
  costos promedio (`CONFIG`)
- Las hojas derivadas de stock, el log de auditoría y el de errores

### Lo que NO vuelve (vive en Script Properties)

Ordenado por lo que más duele:

| Propiedad | Qué pasa si falta |
|---|---|
| `FOLDER_PREFIX` | **LO PEOR: toda foto y documento adjunto deja de abrir.** La app busca en una carpeta que no es donde están. |
| `FOLDER_PREFIX_HISTORY` | Igual, para adjuntos anteriores a un cambio de nombre de empresa. |
| `COMPANY_DOMAIN` | El personal de la empresa deja de reconocerse solo; a todos les pide "Sign in with Google". |
| `WEB_APP_URL` | La app no sabe su propia dirección. |
| `OAUTH_CLIENT_ID` / `_SECRET` | La gente de fuera del dominio no puede entrar. |
| `SETUP_COMPLETE` | La app se cree recién instalada y ofrece correr el asistente otra vez. |
| `WMS_MONITORED_MATERIALS` | Se pierden todas las alertas de stock mínimo. |
| `COMPANY_NAME`, `COMPANY_LOGO_ID` | La app dice "Warehouse" y sin logo. |
| `COLUMN_PREFS` | Los encabezados renombrados vuelven a sus nombres por defecto. |
| `ROLE_PERMS_WAREHOUSE`, `WAREHOUSE_ROLE_LABEL` | Los permisos extra y el nombre del rol vuelven al default. |
| `GEMINI_API_KEY` | El lector de documentos con IA deja de funcionar. |
| `SESSION_SECRET` | Se recrea solo. Todos vuelven a iniciar sesión una vez. |
| `SUPPORT_EMAIL` | Los reportes solo van al admin del cliente, no a nosotros. |

**Antes de necesitar esto:** guarda una foto o un export de las Script
Properties de cada cliente en tu propio archivo de soporte. Sin eso, una
restauración es reconstruir la configuración a mano y adivinando.

---

## Procedimiento de restauración

### Paso 0 — Antes de tocar nada

1. **No borres el archivo dañado.** Renómbralo (`… — ROTO 2026-08-21`). Si la
   restauración sale mal, es lo único que queda.
2. Anota qué se perdió y desde cuándo. Determina **qué backup** necesitas: en
   la app, **Settings → System → All backups in Drive**, o directo en la
   carpeta `<prefijo>_Backups` del Drive del cliente.
3. **Saca las Script Properties del archivo dañado si todavía abre**: editor
   de Apps Script → ⚙️ Project Settings → Script Properties. Cópialas a un
   lado. Esto es lo que te va a ahorrar el 80% del trabajo.

### Paso 1 — Hacer una copia del backup

**No trabajes sobre el archivo de backup.** Es tu único ejemplar bueno.

En Drive: clic derecho sobre el backup → **Hacer una copia**. Renómbrala con
el nombre real del sistema del cliente.

### Paso 2 — Volver a poner las Script Properties

Abre la copia → **Extensiones → Apps Script** → ⚙️ **Project Settings** →
**Script Properties**, y vuelve a crear las del cuadro de arriba con los
valores que guardaste en el Paso 0.

**El orden importa: `FOLDER_PREFIX` primero.** Si no se pone, los adjuntos no
abren y el síntoma no dice por qué.

Si perdiste los valores, hay dos ayudas que ya existen en el código:
- **`FOLDER_PREFIX` se puede deducir**: las carpetas del Drive del cliente se
  llaman `<prefijo>_Docs`, así que el nombre de la carpeta te dice el
  prefijo.
- Menú **🏭 Acopio → 🔧 Advanced → 🩺 Check this installation**: repara solo
  `SESSION_SECRET`, deduce `OAUTH_REDIRECT_URI` desde `WEB_APP_URL`, y marca
  `SETUP_COMPLETE` si ya hay un admin en la lista. Y te dice qué falta.

### Paso 3 — Volver a publicar

**Deploy → New deployment** → Web app → **Execute as: Me** · **Who has
access: Anyone with a Google account**.

Esto genera una **URL nueva**, obligatoriamente: es un proyecto de script
distinto. Por lo tanto:
- Hay que darle la URL nueva al equipo del cliente.
- Hay que **registrar la URL nueva** en Authorized redirect URIs del cliente
  OAuth, y ponerla en `OAUTH_REDIRECT_URI`. Si no, la gente de fuera del
  dominio no entra (ver `ACCESO-Y-LOGIN.md`).

### Paso 4 — Verificar antes de decir que terminó

- [ ] `🩺 Check this installation` sin faltantes
- [ ] El stock de la pantalla principal cuadra con lo que el cliente espera
- [ ] **Abre un movimiento viejo que tenga foto o PDF adjunto y compruébalo.**
      Esta es LA prueba de que `FOLDER_PREFIX` quedó bien, y la que más se
      olvida
- [ ] Entra un usuario del dominio
- [ ] Entra un usuario de fuera del dominio, si los hay
- [ ] Las alertas de stock mínimo siguen configuradas (⚙ Stock Alerts)
- [ ] Vuelve a encender el backup nocturno — **el trigger no se copia**

### Paso 5 — Volver a encender el backup

**🏭 Acopio → 🗄 Backup Now / Enable Daily Backup.** Los triggers pertenecen
al proyecto de script, así que la copia nueva no tiene ninguno: sin este
paso, el sistema restaurado **no se está respaldando** y nadie lo nota hasta
la próxima emergencia.

---

## Mejora propuesta (sin construir — pendiente de decisión)

Que `runBackupNow_` escriba una instantánea de las Script Properties **dentro
de la copia de backup**, en una hoja aparte. Así el Paso 2 pasa de
"reconstruir a mano y adivinando" a "copiar de esta hoja".

Qué habría que decidir antes:
- **Los secretos.** `OAUTH_CLIENT_SECRET` y `GEMINI_API_KEY` quedarían
  legibles para cualquiera que pueda abrir el archivo de backup — que es más
  gente que la que puede ver las Script Properties del proyecto vivo. La
  propuesta sería **excluirlos**, junto con `SESSION_SECRET` (se recrea solo)
  y `WMS_SESSIONS` (efímero), y anotar en la hoja que esos cuatro se vuelven
  a poner a mano.
- Que la hoja se escriba **en la copia, nunca en el archivo vivo**.

Esto convierte el backup en algo que de verdad restaura un sistema, en vez de
solo los datos.
