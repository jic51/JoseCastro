// Servidor estatico minimo para los tests E2E.
// Sirve la raiz del repo, de modo que cada app queda en /APPS/<NOMBRE>/index.html
// Sin dependencias: solo node:http + node:fs.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  // normalize() colapsa los ".." antes de unir, para no salir de ROOT
  let filePath = join(ROOT, normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  // Un directorio sirve su index.html, para poder pedir /APPS/LOQUESEA/
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html');
  } catch { /* si no existe, el readFile de abajo responde el 404 */ }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    // La raiz responde 200 aunque no haya index: Playwright espera un 2xx en
    // webServer.url para dar el servidor por arrancado, y un monorepo de apps
    // no tiene por que tener una portada.
    if (urlPath === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('ok');
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`static server: http://127.0.0.1:${PORT}/ (root: ${ROOT})`);
});
