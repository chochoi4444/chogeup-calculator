// 초급 계산기 로컬 서버
// salary/.env 의 근무 시간 · 세후 월급을 읽어 /config.js 로 페이지에 전달합니다.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, 'salary', '.env');

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

function readConfig() {
  // 요청마다 다시 읽으므로 .env 를 고치면 새로고침만 하면 됩니다
  const env = { ...loadEnv(ENV_FILE), ...process.env };
  const time = (v) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v || '') ? v : null);
  const salary = Number(String(env.NET_SALARY || '').replace(/[^\d]/g, '')) || null;
  return { start: time(env.WORK_START), end: time(env.WORK_END), salary };
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/config.js') {
    res.writeHead(200, { 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-store' });
    return res.end('window.CHOGEUP_CONFIG = ' + JSON.stringify(readConfig()) + ';');
  }

  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  // 폴더 밖 파일과 .env 등 숨김 파일은 내보내지 않음
  if (!file.startsWith(ROOT + path.sep) || path.basename(file).startsWith('.')) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(Number(process.env.PORT || loadEnv(ENV_FILE).PORT || 3001), function () {
  console.log('초급 계산기 → http://localhost:' + this.address().port);
});
