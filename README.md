# BankFlow QA

Simulação de API bancária REST com transferências Pix, construída para
demonstrar um fluxo completo de Quality Assurance: planejamento, design de
casos de teste, automação e integração contínua — sobre um sistema com
lógica de negócio real (não apenas CRUD).

## Por que este projeto existe

A maioria dos portfólios de QA testa APIs prontas ("brownfield"). Este projeto
junta as duas realidades do mercado: parte da API é um CRUD já existente
(`json-server` + `json-server-auth`), e parte foi construída sob medida
(a lógica de transferência Pix), simulando o cenário de um QA que entra num
time e precisa tanto testar quanto ajudar a especificar comportamento.

## Arquitetura

- **CRUD base**: `json-server` + `json-server-auth` (contas, usuários, autenticação JWT)
- **Lógica de negócio Pix**: router Express customizado (`src/pixRoutes.js`),
  incluindo validação de saldo, resolução de chave Pix, prevenção de
  transferência para a própria conta, e **fault injection** (simulação de
  falha do provedor Pix a 10% das requisições)
- **Persistência**: `db.json` via lowdb (camada de validação SQL/MySQL
  planejada para a fase de integridade de dados)

## Decisões técnicas

Todas as decisões de arquitetura estão documentadas em [`decisions/`](./decisions),
seguindo um formato leve de ADR (Architecture Decision Record): contexto,
decisão, alternativas consideradas, consequências para o QA.

## Como rodar localmente

```bash
npm install
npm start
# API disponível em http://localhost:3000
```

## Casos de teste cobertos

Documentados em [`docs/test-plan.md`](./docs/test-plan.md), seguindo estrutura
inspirada em IEEE 829. Automação via Postman/Newman em `postman/` (em progresso).

## Stack

Node.js, Express, json-server, json-server-auth, Postman, Newman, SQL/MySQL,
GitHub Actions, Jira (gestão de defeitos).

## Status

🚧 Em desenvolvimento ativo — este README é atualizado conforme cada fase do
fluxo de QA é concluída.
