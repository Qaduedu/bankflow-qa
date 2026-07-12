# Test Plan — BankFlow QA

Identificador: TP-BANKFLOW-001
Estrutura inspirada na norma IEEE 829.

## 1. Introdução

Este plano cobre o teste do endpoint `POST /pix/transfer` e dos endpoints de
autenticação (`/register`, `/login`) que o protegem, incluindo regras de
negócio, autenticação, autorização, idempotência e concorrência.

## 2. Itens de teste

- `POST /pix/transfer`
- `POST /register`, `POST /login`
- Integridade de saldo pós-transferência (origem e destino)
- Log de transações (`transactions`)

## 3. Funcionalidades a testar

- Validação de payload (campos obrigatórios, tipos)
- Resolução de conta por `pixKey`
- Regra de saldo insuficiente
- Regra de transferência para a própria conta
- Comportamento sob falha simulada do provedor (fault injection)
- Autenticação via JWT (token ausente, inválido, expirado)
- Autorização por posse de conta (proteção contra IDOR)
- Idempotência via header `Idempotency-Key`
- Limite reduzido de valor em horário noturno (20h–6h)
- Lock de concorrência por conta (prevenção de condição de corrida)

## 4. Funcionalidades fora de escopo

- Persistência em banco relacional (MySQL) — planejada para fase futura
- Concorrência entre múltiplas instâncias do servidor (lock atual é válido
  apenas em memória, single-process — ver decisions/decision-008)

## 5. Abordagem

Teste funcional caixa-preta via Postman/Newman, com casos derivados de:
- **Partição de equivalência**: valores válidos vs. inválidos de `amount`
- **Análise de valor limite**: `amount = 0`, valores negativos, saldo exato,
  limite noturno
- **Tabela de decisão**: combinações de conta válida/inválida, saldo
  suficiente/insuficiente, autenticado/não autenticado, dono/não dono da conta

## 6. Critérios de aprovação/reprovação

- Aprovado: todos os status codes e schemas de resposta batem com o esperado
- Reprovado: qualquer divergência de status code, corpo de resposta, ou
  efeito colateral incorreto no saldo das contas

## 7. Ambiente de teste

API local via json-server + Express custom router, porta 3000. Suíte
automatizada via Newman, com reset de fixture (`scripts/reset-db.js`)
garantindo execução idempotente. Pipeline de CI no GitHub Actions.

## 8. Casos de teste

Ver `docs/test-cases/` para o detalhamento de cada caso.

| ID | Cenário | Prioridade |
|---|---|---|
| TC-01 | Transferência bem-sucedida | Alta |
| TC-02 | Payload inválido (campo ausente) | Alta |
| TC-03 | Conta de origem inexistente | Média |
| TC-04 | Chave Pix de destino inexistente | Alta |
| TC-05 | Transferência para a própria conta | Média |
| TC-06 | Saldo insuficiente | Alta |
| TC-07 | Falha simulada do provedor (fault injection) | Alta |
| TC-08 | Requisição sem token | Alta |
| TC-09 | Token inválido ou malformado | Alta |
| TC-10 | IDOR — token válido de outro usuário | Alta |
| TC-11 | Login com senha incorreta | Média |
| TC-12 | Idempotência — mesma chave enviada duas vezes | Alta |
| TC-13 | Limite noturno excedido | Média |
| TC-14 | Concorrência — transferências simultâneas | Média |

## 9. Riscos

Domínio financeiro: falhas não detectadas em validação de saldo, autorização
ou concorrência têm impacto direto e alto (perda, duplicação, ou acesso
indevido a valores). Casos relacionados a essas áreas têm prioridade Alta.
