# Casos de Teste — Camada de Seguranca e Regras de Negocio Avancadas

Referencia: decisions/006, 007, 008

---

## TC-08 — Requisicao sem token
**Prioridade:** Alta
**Dados de entrada:** POST /pix/transfer, sem header Authorization
**Resultado esperado:**
- Status `401 Unauthorized`
- Corpo contem `error: "UNAUTHORIZED"`

---

## TC-09 — Token invalido ou malformado
**Prioridade:** Alta
**Dados de entrada:** POST /pix/transfer, header `Authorization: Bearer token-invalido-123`
**Resultado esperado:**
- Status `401 Unauthorized`
- Corpo contem `error: "UNAUTHORIZED"`

---

## TC-10 — IDOR: token valido, mas de usuario que nao e dono da conta
**Prioridade:** Alta (achado de seguranca real do projeto)
**Pre-condicao:** Um segundo usuario, registrado dinamicamente, autenticado com token proprio, tentando movimentar a conta 1 (que nao lhe pertence)
**Dados de entrada:**
```json
{ "fromAccountId": "1", "pixKey": "maria@pix.com", "amount": 50 }
```
**Resultado esperado:**
- Status `403 Forbidden`
- Corpo contem `error: "FORBIDDEN"`
- Nenhum saldo e alterado

---

## TC-11 — Login com senha incorreta
**Prioridade:** Media
**Dados de entrada:** POST /login com email valido e senha errada
**Resultado esperado:**
- Status `401 Unauthorized` (comportamento nativo do json-server-auth)

---

## TC-12 — Idempotencia: mesma chave enviada duas vezes
**Prioridade:** Alta
**Passos:**
1. Enviar POST /pix/transfer com header `Idempotency-Key: chave-teste-001` — deve processar normalmente (201)
2. Enviar a mesma requisicao de novo, com o mesmo header `Idempotency-Key: chave-teste-001`
**Resultado esperado no segundo envio:**
- Status `200 OK` (nao 201 — nao e uma nova criacao)
- Corpo contem `idempotent: true`
- O saldo NAO e debitado/creditado uma segunda vez

---

## TC-13 — Limite noturno excedido
**Prioridade:** Media
**Observacao:** este caso so pode ser validado quando o servidor esta rodando entre 20h e 6h (horario local do servidor). Fora desse horario, o teste deve ser pulado ou executado manualmente ajustando o relogio do sistema.
**Dados de entrada:**
```json
{ "fromAccountId": "1", "pixKey": "maria@pix.com", "amount": 1500 }
```
**Resultado esperado (apenas em horario noturno):**
- Status `403 Forbidden`
- Corpo contem `error: "NIGHT_LIMIT_EXCEEDED"`

---

## TC-14 — Concorrencia: duas transferencias simultaneas da mesma conta
**Prioridade:** Media
**Observacao:** nao automatizavel de forma simples via Postman/Newman (que executa requisicoes sequencialmente). Validado manualmente com um script Node auxiliar que dispara duas requisicoes em paralelo (Promise.all) contra a mesma conta, com valores que juntos excedem o saldo disponivel.
**Resultado esperado:** apenas uma das duas requisicoes deve ser aceita (201); a outra deve falhar por saldo insuficiente (422), nunca as duas passando ao mesmo tempo.
