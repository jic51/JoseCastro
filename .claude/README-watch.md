# La skill `/watch` — qué es, cómo se usa y qué hay que rehacer cada sesión

Instalada el **2026-10-09** desde `https://github.com/bradautomates/claude-video`
(plugin `watch` v0.3.2, MIT, commit `03ceb42`).

Jose: *"instala esta skill"*.

---

## Qué hace

Convierte un vídeo —un archivo local o una dirección— en **fotogramas con su
segundo exacto y una transcripción**, y me los entrega para que pueda contestar
preguntas sobre lo que pasa dentro.

Es lo que veníamos haciendo a mano con `scratchpad/grab.py` (PyAV) en los reels
de diseño y en los vídeos de la app, pero sistematizado: elige los fotogramas
por **cambio de escena** en vez de a intervalo fijo, quita los casi idénticos, y
sabe recortar un intervalo.

---

## Cómo se usa

```bash
python3 .claude/skills/watch/scripts/watch.py "<archivo-o-URL>" --question "<la pregunta>"
```

Lo que de verdad sirve para nuestros vídeos:

| Opción | Para qué |
|---|---|
| `--start 2:15 --end 2:45` | Recortar al trozo que importa. **La mejor precisión se saca así.** |
| `--timestamps 1:05,2:30` | Clavar momentos concretos ("mira aquí") |
| `--detail balanced` | Por cambio de escena, tope 100 fotogramas (lo normal) |
| `--detail token-burner` | Sin tope. Caro. Para cuando hace falta todo |
| `--resolution 1024` | Subir la resolución cuando hay **texto en pantalla** que leer |
| `--no-dedup` | Cuando los cambios son sutiles y el filtro de casi-iguales se los come |
| `--max-frames N` | Tope duro |

Después hay que **abrir cada fotograma con la herramienta de lectura**: el
informe da las rutas, no las imágenes.

---

## ⚠️ LO QUE HAY QUE REHACER EN CADA SESIÓN

**La skill está en git y llega sola. Sus tres programas NO.**

`ffmpeg`, `ffprobe` y `yt-dlp` se instalan en el contenedor, y el contenedor de
una sesión en la nube **se borra al terminar la sesión**. También se borra
`~/.config/watch/.env`, donde viven las preferencias.

Una orden, alrededor de un minuto:

```bash
bash .claude/watch-dependencias.sh
```

Si ya están puestas no hace nada y lo dice. **Correrla de más no cuesta.**

> Si `apt-get install ffmpeg` da una tanda de errores 404, no es que falte el
> paquete: es que el índice que trae la imagen apunta a versiones ya retiradas
> del archivo de Ubuntu. El script ya hace `apt-get update` antes, por eso.

---

## Las dos decisiones que tomé al instalarla, y cómo cambiarlas

**Motor: `local`.** Los fotogramas y la transcripción se sacan en esta máquina.
No se manda el vídeo a ningún sitio y no hace falta ninguna clave.

La alternativa es el motor **`gemini`**: Google ve el vídeo entero —imagen y
sonido— y contesta él. Es más potente para "¿qué pasa en este vídeo?", pero
**sube el vídeo a Google** (y lo borra después de contestar). Se activa
escribiendo una clave en la línea `GEMINI_API_KEY=` de `~/.config/watch/.env`.

> **Jose: no he puesto ninguna clave ahí.** La de Acopio estaba fallando y te
> dije que la rotaras; además una clave en un contenedor desechable hay que
> volver a pegarla en cada sesión. Si la quieres, dímelo y te digo exactamente
> dónde pegarla — pero piensa antes si quieres que los vídeos de la app y de la
> bodega suban a Google.

**Transcripción de voz: `none`** (sólo subtítulos nativos, si el vídeo los
trae). Las otras tres opciones no salen a cuenta aquí:

- `whisperx` baja **1,5 GB** de modelos que se borran con el contenedor. Pagarlo
  en cada sesión no compensa.
- `groq` y `openai` necesitan claves que no tenemos puestas.

Para una llamada suelta: `--whisper groq` (con `GROQ_API_KEY` puesta).

**Nuestros vídeos son casi todos visuales** —grabaciones de pantalla de la app,
reels de diseño— así que `none` no quita nada de lo que veníamos haciendo.

---

## Lo que NO instalé, y por qué

**El hook `SessionStart`** que trae el plugin. Es inofensivo —comprueba las
dependencias y siempre sale bien— pero en este contenedor las dependencias
empiezan ausentes, así que **imprimiría un aviso al arrancar CADA sesión**,
hubiera vídeo o no. Un aviso que sale siempre deja de leerse, y entonces el día
que diga algo distinto tampoco se va a leer.

**El mecanismo de marketplace** (`/plugin marketplace add …`). El propio README
del proyecto dice que el instalador interactivo `/plugin` **no está disponible
en Claude Code en la web**. La ruta buena aquí es la que dice ese mismo README
para instalación manual: copiar la carpeta `skills/watch/` entera. Eso es lo que
hay.

---

## Comprobado de verdad el día de la instalación

No me fié del "status: ready". Generé un vídeo de 12 segundos con **el número de
segundo escrito en la imagen**, lo pasé por la skill, y abrí los fotogramas:

- el marcado `t=00:02` decía **SEGUNDO 2**
- el marcado `t=00:08` decía **SEGUNDO 8**

Los sellos de tiempo son reales, no etiquetas puestas a ojo. Y el recorte
`--start 0:05 --end 0:07` devolvió sólo fotogramas de dentro de ese intervalo.

También revisé el código antes de instalarlo: **sin `shell=True`, sin `eval`,
sin `exec`, sin `os.system`**; sólo biblioteca estándar, y las únicas llamadas
de red van a `generativelanguage.googleapis.com` (Gemini), `api.groq.com` y
`api.openai.com` — exactamente lo que anuncia, y ninguna se usa con la
configuración `local` + `none` que dejé puesta.

---

## Actualizarla

No se actualiza sola. Para traer una versión nueva:

```bash
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 \
  https://github.com/bradautomates/claude-video /tmp/claude-video-nuevo
rm -rf .claude/skills/watch
cp -R /tmp/claude-video-nuevo/skills/watch .claude/skills/watch
```

Y volver a comprobarla con un vídeo de prueba antes de fiarse — la forma de las
opciones ha cambiado entre la 0.2.0 y la 0.3.x.
