# Casos de Teste — POST /pix/transfer

Referência: docs/test-plan.md (TP-BANKFLOW-PIX-001)

---

## TC-01 — Transferência bem-sucedida
**Prioridade:** Alta
**Pré-condição:** Usuário autenticado (token JWT válido). Conta de origem com saldo suficiente.
**Dados de entrada:**
```json
{ "fromAccountId": "1", "pixKey": "maria@pix.com", "amount": 100 }
```
**Passos:**
1. Enviar POST autenticado para `/pix/transfer` com os dados acima
**Resultado esperado:**
- Status `201 Created`
- Corpo contém `status: "COMPLETED"`
- Saldo da conta de origem diminui em 100
- Saldo da conta de destino aumenta em 100
- Um registro novo aparece em `transactions`

---

## TC-02 — Payload inválido (campo ausente)
**Prioridade:** Alta
**Pré-condição:** Usuário autenticado.
**Dados de entrada:**
```json
{ "pixKey": "maria@pix.com", "amount": 100 }
```
(faltando `fromAccountId`)
**Resultado esperado:**
- Status `400 Bad Request`
- Corpo contém `error: "INVALID_PAYLOAD"`
- Nenhum saldo é alterado

---

## TC-03 — Conta de origem inexistente
**Prioridade:** Média
**Dados de entrada:**
```json
{ "fromAccountId": "999", "pixKey": "maria@pix.com", "amount": 100 }
```
**Resultado esperado:**
- Status `404 Not Found`
- Corpo contém `error: "ORIGIN_NOT_FOUND"`

---

## TC-04 — Chave Pix de destino inexistente
**Prioridade:** Alta
**Dados de entrada:**
```json
{ "fromAccountId": "1", "pixKey": "chave-que-nao-existe@pix.com", "amount": 100 }
```
**Resultado esperado:**
- Status `404 Not Found`
- Corpo contém `error: "DESTINATION_NOT_FOUND"`

---

## TC-05 — Transferência para a própria conta
**Prioridade:** Média
**Dados de entrada:**
```json
{ "fromAccountId": "1", "pixKey": "eduardo@pix.com", "amount": 50 }
```
(pixKey pertence à mesma conta de origem)
**Resultado esperado:**
- Status `400 Bad Request`
- Corpo contém `error: "SAME_ACCOUNT_TRANSFER"`

---

## TC-06 — Saldo insuficiente
**Prioridade:** Alta
**Pré-condição:** `amount` maior que o saldo atual da conta de origem.
**Dados de entrada:**
```json
{ "fromAccountId": "1", "pixKey": "maria@pix.com", "amount": 999999 }
```
**Resultado esperado:**
- Status `422 Unprocessable Entity`
- Corpo contém `error: "INSUFFICIENT_FUNDS"`
- Nenhum saldo é alterado

---

## TC-07 — Falha simulada do provedor (fault injection)
**Prioridade:** Alta
**Observação:** este caso depende de sorte (10% de chance por requisição). Para validar, repetir TC-01 cerca de 20 a 30 vezes e confirmar que a falha aparece pelo menos uma vez.
**Resultado esperado quando ocorre:**
- Status `500 Internal Server Error`
- Corpo contém `error: "PIX_PROVIDER_UNAVAILABLE"`
- Um registro com `status: "FAILED_SIMULATED_FAULT"` aparece em `transactions`
- Nenhum saldo é alterado
