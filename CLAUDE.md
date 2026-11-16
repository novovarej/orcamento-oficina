# Orçamento Rápido — Oficina

## Objetivo
App para oficina mecânica montar orçamentos em poucos minutos, sem um funcionário dedicado só a isso.
Produto que o Tiago (Novo Varejo) pretende vender para oficinas de Botucatu e região.

## Contexto do cliente piloto
- A oficina já usa um sistema de oficina; o gargalo é **montar o documento** do orçamento.
- O orçamento chega ao cliente pelo **WhatsApp**.
- Quem usa é o **funcionário do balcão**, no computador.

## Como está hoje (v0.1)
- Um único arquivo `index.html` (HTML + CSS + JS puro, sem servidor, sem instalação).
- Dados salvos no navegador (localStorage): dados da oficina, catálogo de peças/serviços com último preço, histórico.
- Gera PDF (imprimir) e mensagem formatada para o WhatsApp (link wa.me).

## Regras
- Interface e textos em português do Brasil; valores em R$.
- Manter simples: o usuário é balconista, não técnico.
- Testar abrindo o `index.html` direto no navegador.

## Próximas ideias
- Importar peças/preços do sistema da oficina (planilha exportada).
- Colar uma anotação solta ("troca pastilha + disco dianteiro gol") e a IA montar os itens.
- Dados na nuvem para usar em mais de um computador e no celular.
- Status do orçamento (enviado, aprovado, recusado) e lembrete de follow-up.
