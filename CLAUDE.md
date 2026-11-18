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
- IA: Google Gemini (REST `generateContent`, modelo configurável, padrão `gemini-4-hydrogen` (desde v0.9)), chamada direto do navegador com a chave da oficina (guardada em localStorage). Vídeo até 14 MB vai inline; acima disso, File API resumable.
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

## Só o áudio vai para a IA (v0.5, 17/11/2026)
- Tiago: "o vídeo é só comprovação; o que importa é o áudio, onde o mecânico explica tudo".
- O app extrai o som do vídeo no celular (`decodeAudioData` + `OfflineAudioContext`) → WAV 16 kHz mono (~32 KB/s; 26 s ≈ 0,8 MB) e manda só isso, inline. O vídeo original segue para o cliente pelo WhatsApp.
- Vídeo sem som → aviso para gravar de novo. Se o aparelho não conseguir extrair o áudio, reserva: manda o vídeo (reduzido a ~1,2 Mbps se > 14 MB, ou upload).
- Botão Gravar abre câmera dentro do app (MediaRecorder, 720p ~2,5 Mbps, até 3 min); sem permissão/aparelho antigo → câmera do sistema.
- No 1º teste real pelo servidor (31 MB, 4G), o upload falhou uma vez e o app reenviou sozinho; ficou lento — motivo desta mudança.

## Modo rápido (v0.6, 17/11/2026)
- Com o áudio (0,8 MB) a demora passou a ser a resposta da IA. Agora vai `thinkingConfig` baixo (`thinkingLevel:'low'`; na 2.5 `thinkingBudget` 0/128); se o modelo recusar (400 com "think"), repete sem o ajuste.
- Contador de segundos na tela enquanto a IA responde; ao final mostra o tempo e o modelo usado (para diagnosticar lentidão).

## Escolha rápida da IA (v0.7, 17/11/2026)
- No teste real o principal (`gemini-3.8-flash`) falhou e o app esperou 5s+15s antes da reserva — lento. A chave do Tiago mostra no AI Studio o "Gemini 4 Hydrogen" (`gemini-4-hydrogen`).
- Agora: lista de modelos da chave aceita qualquer gemini de texto (não só flash/pro); se o modelo configurado não existe na chave, usa direto os disponíveis; 1ª rodada passa por todos sem esperar, 2ª rodada após 10s.
- Guarda em localStorage `orv_modeloOk` (o que funcionou, tentado primeiro) e `orv_modelosRuins` (404). Salvar ⚙️ zera os dois.

## Diagnóstico de velocidade (v0.8, 17/11/2026)
- Teste real (CR-V, 46 s de áudio = 1,4 MB): 89 s+ esperando uma única resposta (chave no nível gratuito).
- Limite de 45 s por resposta: estourou → passa para a próxima IA.
- ⚙️ "Testar IAs": manda "Responda apenas: OK" para cada modelo da chave em paralelo, mostra o tempo de cada um e grava o mais rápido em `orv_modeloOk`.
- Contador mostra o modelo em uso. Versão aparece em ⚙️. `public/_headers` com `Cache-Control: no-cache`.

## Duas etapas: transcrever + montar (v1.0, 18/11/2026)
- Medição real no PC do Tiago (18/11): `gemini-3.7-flash` travou 78 s e deu 503 (era o que o celular usava, aprendido em `orv_modeloOk`); `gemini-4-hydrogen` deu 503 com áudio mas respondeu texto em 8,7 s; `gemini-3.5-transcribe` transcreveu 40 s de áudio em 8,9 s (não aceita JSON mode).
- Agora: etapa 1 = `*-transcribe` (reserva: Hydrogen) só transcreve; etapa 2 = Hydrogen monta o JSON a partir do texto (30 s por modelo, depois reserva). Se a transcrição falhar toda, volta ao áudio direto.
- Modelo principal fixo = `MODELO_PADRAO` (o campo antigo `cfg.modelo` não manda mais). Aprendizado renomeado para `orv_modeloOk2` (descarta o 3.7 gravado). Corrigido bug: o reset do aprendizado rodava a cada abertura do app.
- Se o modelo recusar `responseSchema`/JSON mode (400), repete sem schema.

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
