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
- `index.html` único (HTML + CSS + JS puro), feito para o **celular**.
- IA: Google Gemini (REST `generateContent`, modelo configurável, padrão `gemini-3.8-flash`), chamada direto do navegador com a chave da oficina (guardada em localStorage). Vídeo até 14 MB vai inline; acima disso, File API resumable.
- Resposta em JSON (schema): transcrição, resumo para o cliente, itens (peça/serviço, qtd, prioridade, motivo, `tabela_id`) e alertas. **A IA não dá preço**: os preços vêm da tabela da oficina; item sem preço fica em vermelho.
- Envio: Web Share API (vídeo + texto) para o WhatsApp; alternativa só texto via wa.me no número do cliente.
- Dados em localStorage com prefixo `orv_`: cfg, veics, cat (tabela de preços que aprende), hist (sem vídeo).
- Precisa abrir por **https** (câmera e compartilhamento não funcionam em arquivo local nem dentro de artifact).
- `versao-0.1-manual.html`: v0.1, orçamento digitado no computador.

## Resiliência da IA (v0.3, 17/11/2026)
- Erro 503 "high demand" do Gemini apareceu no 1º teste real (HB20). Agora: até 3 tentativas por modelo (espera 5s e 15s, com contagem na tela), depois troca para modelo de reserva (lista `models` da própria chave, só gemini flash/pro estáveis, até 4 modelos).
- Erros traduzidos para português (chave inválida, limite 429, congestionado, sem internet, tempo esgotado, resposta fora do formato).
- Vídeo enviado é reaproveitado por 40 min se o balconista tocar de novo — não reenvia 30 MB.
- Testado com respostas simuladas (Playwright): ok, 503 só no principal → reserva, tudo 503, chave inválida.

## Pendências conhecidas
- Testado só com IA simulada (vídeo do Honda CR-V); falta o teste real com a chave Gemini.
- A chave fica no aparelho: ok para piloto; para vender, mover a chamada da IA para um servidor.
- Hospedagem https ainda não definida (repo privado → GitHub Pages exige plano pago).

## Regras
- Interface e textos em português do Brasil; valores em R$.
- Manter simples: o usuário é balconista, não técnico.
- Testar abrindo o `index.html` direto no navegador.

## Próximas ideias
- Importar peças/preços do sistema da oficina (planilha exportada).
- Dados na nuvem para usar em mais de um computador e no celular.
- Status do orçamento (enviado, aprovado, recusado) e lembrete de follow-up.
