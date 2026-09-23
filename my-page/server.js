// Мини-Live Server: раздаёт файлы из папки и авто-перезагружает страницу
// при изменении .html / .css / .js файлов. Запуск: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5500;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// «Версия» — самая свежая дата изменения среди html/css/js файлов.
// Клиентская страница опрашивает её и перезагружается, когда та меняется.
function version() {
  let max = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|css|js)$/i.test(entry.name)) {
        try {
          const stat = fs.statSync(full);
          if (stat.mtimeMs > max) max = stat.mtimeMs;
        } catch (err) {}
      }
    }
  }
  walk(ROOT);
  return max;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // Служебный эндпоинт для авто-перезагрузки
  if (url.pathname === '/__reload__') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ version: version() }));
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  const file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('403 Forbidden');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';

    if (file.endsWith('.html')) {
      // Вставляем скрипт авто-перезагрузки перед закрывающим </body>
      const snippet =
        '<script>setInterval(function(){fetch("/__reload__").then(function(r){return r.json();}).then(function(d){if(typeof window.__version==="undefined"){window.__version=d.version;}else if(window.__version!==d.version){location.reload();}else{window.__version=d.version;}});},700);</script>';
      const html = data.toString().replace('</body>', snippet + '</body>');
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      return res.end(html);
    }

    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Mini Live Server запущен: http://localhost:' + PORT + '/');
});