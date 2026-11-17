# Orçamento Rápido — Oficina

## Objetivo
App para oficina mecânica montar orçamentos em poucos minutos, sem um funcionário dedicado só a isso.
Produto que o Tiago (Novo Varejo) pretende vender para oficinas de Botucatu e região.

## Contexto do cliente piloto
- A oficina já usa um sistema de oficina; o gargalo é **montar o documento** do orçamento.
- O orçamento chega ao cliente pelo **WhatsApp**.
- Quem usa é o **funcionário do balcão**, no computador.

## Como está hoje (v0.2 — orçamento por vídeo, 16/11/2026)
- Decisão do Tiago: fluxo simples, **só vídeo + WhatsApp**. Cliente e veículo são cadastrados antes; o mecânico grava o vídeo falando o diagnóstico; a IA monta o orçamento.
- `public/index.html` único (HTML + CSS + JS puro), feito para o **celular**.
- IA: Google Gemini (REST `generateContent`, modelo configurável, padrão `gemini-3.8-flash`), chamada direto do navegador com a chave da oficina (guardada em localStorage). Vídeo até 14 MB vai inline; acima disso, File API resumable.
- Resposta em JSON (schema): transcrição, resumo para o cliente, itens (peça/serviço, qtd, prioridade, motivo, `tabela_id`) e alertas. **A IA não dá preço**: os preços vêm da tabela da oficina; item sem preço fica em vermelho.
- Envio: Web Share API (vídeo + texto) para o WhatsApp; alternativa só texto via wa.me no número do cliente.
- Dados em localStorage com prefixo `orv_`: cfg, veics, cat (tabela de preços que aprende), hist (sem vídeo).
- Precisa abrir por **https** (câmera e compartilhamento não funcionam em arquivo local nem dentro de artifact).
- `public/versao-0.1-manual.html`: v0.1, orçamento digitado no computador.

## Resiliência da IA (v0.3, 17/11/2026)
- Erro 503 "high demand" do Gemini apareceu no 1º teste real (HB20). Agora: até 3 tentativas por modelo (espera 5s e 15s, com contagem na tela), depois troca para modelo de reserva (lista `models` da própria chave, só gemini flash/pro estáveis, até 4 modelos).
- Erros traduzidos para português (chave inválida, limite 429, congestionado, sem internet, tempo esgotado, resposta fora do formato).
- Vídeo enviado é reaproveitado por 40 min se o balconista tocar de novo — não reenvia 30 MB.
- Testado com respostas simuladas (Playwright): ok, 503 só no principal → reserva, tudo 503, chave inválida.

## Servidor (v0.4, 17/11/2026)
- Cloudflare Worker (`src/worker.js`, `wrangler.jsonc`) serve `public/` e repassa `/api/*` ao Gemini com a chave do segredo `GEMINI_KEY`. A chave nunca vai ao celular.
- Acesso por **código da oficina** (cabeçalho `X-Codigo-Oficina`), lista em `OFICINAS` no `wrangler.jsonc`. Só caminhos necessários são liberados (models, generateContent, upload de arquivo, status do arquivo, /api/ping).
- Upload resumable: o servidor troca o `x-goog-upload-url` do Google por `/api/upload-sessao?u=...` e repassa em streaming (testado com 69 MB).
- No app, campo "Código da oficina"; se o valor começar com `AIza`, usa o Google direto (modo teste).
- Testado com `wrangler dev` + Google simulado (`GOOGLE_API` em `.dev.vars`) + Playwright.

## Pendências conhecidas
- Falta o teste real com a chave Gemini (vídeo do HB20 deu 503 na v0.2).
- Tiago precisa criar a conta Cloudflare e conectar o repo (passo a passo no README).
- Chave Gemini no plano grátis tem limite baixo e o Google pode usar os dados; para vender, ativar faturamento no AI Studio.

## Regras
- Interface e textos em português do Brasil; valores em R$.
- Manter simples: o usuário é balconista, não técnico.
- Testar abrindo `public/index.html` direto no navegador (modo teste com chave AIza) ou com `wrangler dev`.

## Próximas ideias
- Importar peças/preços do sistema da oficina (planilha exportada).
- Dados na nuvem para usar em mais de um computador e no celular.
- Status do orçamento (enviado, aprovado, recusado) e lembrete de follow-up.
