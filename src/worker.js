/*
 * Orçamento Rápido — servidor (Cloudflare Worker)
 * - Serve o app (pasta public/) num link https fixo.
 * - Guarda a chave do Google Gemini (segredo GEMINI_KEY): ela nunca vai para o celular.
 * - Cada oficina entra com um código (variável OFICINAS, JSON {"CODIGO":"Nome da oficina"}).
 * Tudo que começa com /api/ é repassado ao Google, com a chave colocada aqui.
 */
const GOOGLE = 'https://generativelanguage.googleapis.com';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
const erro = (status, message) => json({ error: { code: status, message, status: 'ORCAMENTO_RAPIDO' } }, status);

function oficinas(env) {
  try { return JSON.parse(env.OFICINAS || '{}'); } catch { return {}; }
}

/* Só estes caminhos podem ser usados (nada além do necessário ao app) */
function permitido(metodo, caminho) {
  if (metodo === 'GET' && caminho === '/v1beta/models') return true;
  if (metodo === 'POST' && /^\/v1beta\/models\/[\w.\-]+:generateContent$/.test(caminho)) return true;
  if (metodo === 'POST' && caminho === '/upload/v1beta/files') return true;
  if (metodo === 'GET' && /^\/v1beta\/files\/[\w\-]+$/.test(caminho)) return true;
  return false;
}

function comChave(url, env) {
  const u = new URL(url);
  u.searchParams.delete('key');
  u.searchParams.set('key', env.GEMINI_KEY);
  return u.toString();
}

/* Cabeçalhos que seguem para o Google */
function cabecalhos(req) {
  const h = new Headers();
  for (const [k, v] of req.headers) {
    const kl = k.toLowerCase();
    if (kl === 'content-type' || kl === 'content-length' || kl.startsWith('x-goog-upload')) h.set(k, v);
  }
  return h;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) {
      // Arquivos do app (o Cloudflare serve public/ antes de chegar aqui); qualquer outra coisa: página inicial
      return env.ASSETS ? env.ASSETS.fetch(new Request(new URL('/', url), req)) : new Response('Orçamento Rápido', { status: 404 });
    }
    if (!env.GEMINI_KEY) return erro(500, 'Servidor sem a chave da IA configurada (GEMINI_KEY).');

    const base = (env.GOOGLE_API || GOOGLE).replace(/\/$/, '');
    const codigo = (req.headers.get('x-codigo-oficina') || '').trim().toUpperCase();
    const lista = oficinas(env);
    const nome = Object.entries(lista).find(([c]) => c.toUpperCase() === codigo)?.[1];
    if (!codigo || !nome) return erro(401, 'Código da oficina inválido. Confira em ⚙️ Configurações.');

    const caminho = url.pathname.slice(4); // tira o "/api"

    // Teste do código (tela de configurações)
    if (caminho === '/ping') return json({ ok: true, oficina: nome });

    // Envio do vídeo em partes (segunda etapa do upload): o endereço de sessão do Google vem em ?u=
    if (caminho === '/upload-sessao' && req.method === 'POST') {
      const destino = url.searchParams.get('u') || '';
      if (!destino.startsWith(base + '/upload/')) return erro(400, 'Endereço de envio inválido.');
      const r = await fetch(comChave(destino, env), { method: 'POST', headers: cabecalhos(req), body: req.body });
      return new Response(r.body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } });
    }

    if (!permitido(req.method, caminho)) return erro(404, 'Caminho não permitido.');

    const destino = new URL(base + caminho);
    for (const [k, v] of url.searchParams) if (k !== 'key') destino.searchParams.set(k, v);
    const r = await fetch(comChave(destino, env), {
      method: req.method,
      headers: cabecalhos(req),
      body: req.method === 'GET' ? undefined : req.body,
    });

    const h = new Headers({ 'content-type': r.headers.get('content-type') || 'application/json' });
    // Início do upload: o Google devolve o endereço da sessão; trocamos por um endereço deste servidor
    const sessao = r.headers.get('x-goog-upload-url');
    if (sessao) h.set('x-goog-upload-url', `${url.origin}/api/upload-sessao?u=${encodeURIComponent(sessao)}`);
    return new Response(r.body, { status: r.status, headers: h });
  },
};
