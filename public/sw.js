// Service worker mínimo: só permite instalar o app na tela inicial.
// Não guarda nada em cache (as atualizações chegam na hora).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
