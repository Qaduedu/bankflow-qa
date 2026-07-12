# BankFlow QA

![CI](https://github.com/Qaduedu/bankflow-qa/actions/workflows/ci.yml/badge.svg)

API bancária REST simulando transferências Pix, construída para demonstrar um
ciclo completo de Quality Assurance — planejamento, design de casos de teste,
automação e integração contínua — sobre um sistema com lógica de negócio e
regras de segurança reais, não apenas CRUD.

## Sobre o projeto

O projeto combina dois cenários comuns no mercado: parte da API é um CRUD já
existente (`json-server` + `json-server-auth`), e parte foi construída sob
medida (a lógica de transferência Pix), reproduzindo o cenário de um QA que
entra em um time e precisa tanto testar quanto ajudar a especificar
comportamento.

## Funcionalidades

- Transferência Pix com validação de saldo, resolução de conta por chave e
  prevenção de transferência para a própria conta
- Autenticação via JWT e autorização por posse de conta (proteção contra IDOR)
- Idempotência via header `Idempotency-Key`, evitando duplicidade de transações
- Limite reduzido de valor em horário noturno (20h–6h)
- Lock de concorrência por conta, prevenindo condição de corrida em
  transferências simultâneas
- Simulação de falha do provedor Pix (fault injection, 10% das requisições)

## Segurança

Durante o desenvolvimento, foi identificada e corrigida uma vulnerabilidade de
**IDOR (Insecure Direct Object Reference)**: o endpoint de transferência
aceitava o identificador da conta de origem sem confirmar que ela pertencia
ao usuário autenticado. A correção, a análise de risco e os testes de
regressão associados estão documentados em
[`decisions/decision-006-auth-idor.md`](./decisions/decision-006-auth-idor.md).

## Arquitetura

- **CRUD base**: `json-server` + `json-server-auth` (contas, usuários, autenticação)
- **Lógica de negócio**: router Express customizado (`src/pixRoutes.js`)
- **Persistência**: `db.json` via lowdb, com fixture de reset (`scripts/reset-db.js`)
  garantindo testes idempotentes

Decisões de arquitetura documentadas em [`decisions/`](./decisions), no
formato de ADR (Architecture Decision Record): contexto, decisão,
alternativas consideradas, consequências para QA.

## Como executar

\`\`\`bash
npm install
npm start
# API disponível em http://localhost:3000
\`\`\`

## Testes automatizados

15 casos de teste documentados em [`docs/test-cases/`](./docs/test-cases),
cobrindo regras de negócio, autenticação, autorização e idempotência —
projetados com técnicas de partição de equivalência, valor limite e tabela
de decisão. Automatizados via Postman/Newman, com 21 assertions.

\`\`\`bash
npm test
\`\`\`

Executa a suíte completa: reseta o banco ao estado inicial, roda os testes,
e gera relatório em \`reports/newman/report.html\`.

## CI/CD

Pipeline no GitHub Actions executa a suíte completa a cada push para \`main\`,
publicando o relatório de testes como artefato da execução.

## Stack

Node.js, Express, json-server, json-server-auth, JWT, Postman, Newman,
GitHub Actions.

## Status

Versão 1.0 concluída — cobertura funcional, de segurança e de regras de
negócio completa, com pipeline de CI ativo.
