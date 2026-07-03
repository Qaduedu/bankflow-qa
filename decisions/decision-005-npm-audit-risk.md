# Decisão 005 — Vulnerabilidades de dependências (npm audit) — risco aceito

## Contexto
Ao instalar `json-server@0.17.4`, `json-server-auth` e `express`, o `npm audit`
reportou vulnerabilidades nas dependências transitivas (bibliotecas usadas
internamente por essas dependências, não escritas por nós):
- express@4.18.2: 2 vulnerabilidades (moderada + alta)
- Total do projeto: 9 vulnerabilidades (3 baixa, 2 moderada, 4 alta)

## Decisão
Não aplicar `npm audit fix --force` neste momento.

## Justificativa (análise de risco)
- **Superfície de exposição**: a API roda exclusivamente em `localhost`, sem
  deploy público, sem tráfego de rede externo. O risco real de exploração é
  baixo neste contexto.
- **Compatibilidade**: `json-server-auth` depende de uma faixa específica de
  versões do `json-server` (0.x). Forçar upgrade das dependências pode
  quebrar a autenticação JWT, que é parte central do escopo de teste do
  projeto.
- **Trade-off consciente**: prioriza-se estabilidade do ambiente de teste
  sobre a resolução imediata de vulnerabilidades que não se aplicam ao
  contexto de uso atual.

## Ação futura
Caso o projeto evolua para deploy público (ex: demonstração hospedada), este
risco deve ser reavaliado antes do deploy — migrar para uma stack de auth
mais atual (ex: Express + JWT customizado) em vez do `json-server-auth`.

## Relevância para QA
Este registro é, em si, um artefato de teste: documenta uma decisão de
risco-benefício, prática comum em times de QA/segurança ao avaliar
vulnerabilidades reportadas por ferramentas automatizadas (SCA - Software
Composition Analysis).
