# Llevarse el sistema a otro repo

`instalar-kit.sh` es autocontenido: escribe él mismo todos los archivos, no copia
de ningún sitio. Un solo archivo, sin dependencias más allá de `bash` y `node`.

Instala: los 3 agentes, el skill `build-loop`, los 2 hooks, `settings.json`,
`tests/server.mjs`, `playwright.config.js`, `PLANTILLA-REQUISITOS.md`, y ajusta
`package.json` y `.gitignore`.

No pisa nada. Si un archivo ya existe, deja el suyo como `*.nuevo` para que
compares antes de reemplazar.

> **Las URL de abajo apuntan a la rama `claude/nice-rubin-u5hv3g`**, que es donde
> vive el archivo hoy. Cuando fusiones esa rama a `master`, cambia
> `claude/nice-rubin-u5hv3g` por `master` en las tres.

---

## Camino 1 — en otra sesión de Claude Code (lo más fácil)

Pégale esto a Claude en la otra sesión:

```
Instala el kit de agentes con verificación ejecutable en este repo:

curl -fsSL https://raw.githubusercontent.com/jic51/JoseCastro/claude/nice-rubin-u5hv3g/scripts/instalar-kit.sh | bash

Después corre npm install y dime qué quedó instalado.
```

## Camino 2 — en tu propia computadora

```bash
cd /ruta/del/otro/repo
curl -fsSL https://raw.githubusercontent.com/jic51/JoseCastro/claude/nice-rubin-u5hv3g/scripts/instalar-kit.sh | bash
npm install
```

## Camino 3 — sin internet, con los dos repos en el mismo disco

```bash
bash /ruta/a/JoseCastro/scripts/instalar-kit.sh /ruta/del/otro/repo
cd /ruta/del/otro/repo && npm install
```

---

## Después de instalar, siempre

1. `npm install`
2. **Reinicia la sesión de Claude Code.** Los agentes y los hooks se leen al
   arrancar; si no reinicias, el gate no existe todavía.
3. Pídele a Claude: *"escribe el REQUISITOS.md de \<app\> y sus tests base"*.

## Comprobar que el gate quedó vivo

```bash
echo '{}' | .claude/hooks/test-gate.sh; echo "exit=$?"
```

`exit=0` con la suite en verde. Si la suite está roja debe dar `exit=2`: ese 2 es
lo que impide cerrar un turno con tests fallando.
