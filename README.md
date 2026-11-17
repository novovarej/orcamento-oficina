# Orçamento Rápido — Oficina (Zonta IA)

O mecânico grava um vídeo do carro **falando** o que precisa ser feito. A IA assiste, ouve e monta o orçamento com os preços da oficina. O vídeo e o orçamento vão juntos para o cliente pelo WhatsApp.

## Como está organizado
- `public/index.html` — o app (abre no celular).
- `src/worker.js` — o servidor (Cloudflare Workers): hospeda o app num link https e **guarda a chave da IA**. O celular da oficina só tem um **código de acesso**.
- `wrangler.jsonc` — configuração do servidor e **lista de códigos das oficinas** (`OFICINAS`).

## Colocar no ar (uma vez só, ~10 min, dá para fazer pelo celular)
1. Crie uma conta grátis em **dash.cloudflare.com**.
2. Menu **Compute (Workers)** → **Workers & Pages** → **Create** → **Import a repository** → conecte o GitHub e escolha `novovarej/orcamento-oficina` → **Deploy** (deixe os comandos como vierem; o de deploy é `npx wrangler deploy`).
3. No worker criado (`orcamento-rapido`) → **Settings** → **Variables and Secrets** → **Add** → tipo **Secret**, nome `GEMINI_KEY`, valor: a chave do Google (aistudio.google.com → Get API key). Salve.
4. O link fica parecido com `https://orcamento-rapido.SEU-USUARIO.workers.dev`. Abra no celular da oficina → ⚙️ → **Código da oficina** → Salvar (aparece "✓ Código ok").
5. No Chrome do celular: menu ⋮ → **Adicionar à tela inicial**.

Depois disso, cada atualização enviada ao GitHub entra no ar sozinha.

## Nova oficina
Acrescente uma linha em `OFICINAS` no `wrangler.jsonc` (`"CÓDIGO": "Nome"`). Para cortar o acesso, apague a linha.

## Testes
`public/index.html` aberto direto com uma chave `AIza…` no campo do código usa o Google direto (modo teste, sem servidor).
