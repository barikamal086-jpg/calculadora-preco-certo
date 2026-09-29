// Service worker: deixa o app funcionando sem internet.
// Ao publicar uma nova versão do app, altere o número abaixo.
const VERSAO = 'preco-certo-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Páginas: tenta a internet primeiro (pega atualizações) e usa a cópia salva se estiver offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSAO).then((c) => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Demais arquivos (ícones, fontes): usa a cópia salva e busca na internet só se não tiver.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VERSAO).then((c) => c.put(req, cp)); }
    return r;
  }).catch(() => hit)));
});
