# Test Plan — BankFlow QA (Módulo Pix)

Estrutura inspirada na norma IEEE 829, adaptada para o escopo do projeto.

## 1. Identificador
TP-BANKFLOW-PIX-001

## 2. Introdução
Este plano cobre o teste do endpoint `POST /pix/transfer`, responsável por
simular transferências via Pix entre contas do sistema BankFlow.

## 3. Itens de teste
- `POST /pix/transfer`
- Integridade de saldo pós-transferência (origem e destino)
- Log de transações (`transactions`)

## 4. Funcionalidades a testar
- Validação de payload (campos obrigatórios, tipos)
- Resolução de conta por `pixKey`
- Regra de saldo insuficiente
- Regra de transferência para a própria conta
- Comportamento sob falha simulada do provedor (fault injection)
- Autenticação/autorização (JWT via json-server-auth)

## 5. Funcionalidades fora de escopo (por ora)
- Concorrência real (múltiplas transferências simultâneas na mesma conta)
- Persistência em banco relacional (MySQL) — fase futura

## 6. Abordagem
Teste funcional caixa-preta via Postman, com casos derivados de:
- **Partição de equivalência**: valores válidos vs. inválidos de `amount`
- **Análise de valor limite**: `amount = 0`, valores negativos, saldo exato
- **Tabela de decisão**: combinações de conta válida/inválida × saldo suficiente/insuficiente

## 7. Critérios de aprovação/reprovação
- Aprovado: todos os status codes e schemas de resposta batem com o esperado
- Reprovado: qualquer divergência de status code, corpo de resposta, ou
  efeito colateral incorreto no saldo das contas

## 8. Ambiente de teste
API local via `json-server` + Express custom router, porta 3000.
Coleção Postman com environment dedicado (`local`).

## 9. Casos de teste (referência)
Ver `docs/test-cases/` para o detalhamento de cada caso listado abaixo:

| ID | Cenário | Prioridade |
|---|---|---|
| TC-01 | Transferência bem-sucedida | Alta |
| TC-02 | Payload inválido (campo ausente) | Alta |
| TC-03 | Conta de origem inexistente | Média |
| TC-04 | Chave Pix de destino inexistente | Alta |
| TC-05 | Transferência para a própria conta | Média |
| TC-06 | Saldo insuficiente | Alta |
| TC-07 | Falha simulada do provedor (fault injection) | Alta |

## 10. Riscos
Domínio financeiro: falhas não detectadas em validação de saldo ou
resolução de conta têm impacto direto e alto (perda/duplicação de valores).
Por isso os casos de saldo e resolução de conta têm prioridade Alta.
