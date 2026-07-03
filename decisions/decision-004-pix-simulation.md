# Decisão 004 — Simulação de transferência Pix

## Contexto
O core da API (contas, usuários) já é servido via `json-server` + `json-server-auth`,
que geram CRUD automático mas não suportam regras de negócio. Transferência Pix
exige validação de saldo, resolução de chave para conta destino, e comportamento
de falha — não é um CRUD simples.

## Decisão
Criar um router Express customizado (`pixRoutes.js`) montado *antes* do router
padrão do json-server, operando sobre a mesma instância do `db.json` (via lowdb).
Isso evita duplicar a base de dados e mantém o restante da API (CRUD de contas,
usuários) intacto e testável do jeito que já estava.

## Alternativas consideradas
- **Reescrever tudo em Express puro**: descartado por custo de tempo sem ganho
  de realismo para o objetivo do portfólio.
- **Usar apenas json-server com middleware de validação**: descartado porque
  não suporta lógica condicional complexa (fault injection, resolução por
  chave Pix) de forma legível.

## Consequências para o QA
Esse endpoint introduz uma superfície de teste rica e representativa de sistemas
financeiros reais:
- Caminho feliz (transferência bem-sucedida)
- Payload inválido (campos ausentes, amount não numérico ou <= 0)
- Conta de origem inexistente
- Chave Pix de destino inexistente
- Transferência para a própria conta
- Saldo insuficiente
- Falha simulada do provedor (taxa de 10%, testável rodando a chamada N vezes)

Todos esses casos devem virar casos de teste formais no Postman/Newman, com
asserts de status code e schema de resposta.
