// pixRoutes.js
// Simula a lógica de negócio de uma transferência Pix sobre o db.json do json-server.
// Por que um router separado? Porque json-server não tem lugar nativo pra regra de
// negócio - ele só faz CRUD. Isolar essa lógica aqui também facilita escrever testes
// unitários nela no futuro, sem precisar subir o servidor inteiro.

const express = require('express');
const router = express.Router();

// Taxa de falha simulada do "provedor Pix" (10%).
// Por que existir? Porque em produção, Pix depende do Banco Central e de outros
// bancos - falhas de rede/timeout são reais e esperadas. Um QA sério precisa
// garantir que o sistema se comporta bem quando o provedor falha, não só no
// caminho feliz.
const FAULT_INJECTION_RATE = 0.1;

function randomDelay(min = 50, max = 400) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );
}

function logTransaction(db, data) {
  const transactions = db.get('transactions');
  const transaction = {
    id: Date.now().toString(),
    ...data,
    timestamp: new Date().toISOString(),
  };
  transactions.push(transaction).write();
  return transaction;
}

module.exports = (db) => {
  router.post('/pix/transfer', async (req, res) => {
    const { fromAccountId, pixKey, amount } = req.body;

    // 1. Validação de payload - primeira linha de defesa
    if (!fromAccountId || !pixKey || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'fromAccountId, pixKey e amount (numérico > 0) são obrigatórios.',
      });
    }

    await randomDelay(); // simula latência de rede/processamento real

    const accounts = db.get('accounts');
    const fromAccount = accounts.find({ id: fromAccountId }).value();
    const toAccount = accounts.find({ pixKey }).value();

    if (!fromAccount) {
      return res.status(404).json({
        error: 'ORIGIN_NOT_FOUND',
        message: 'Conta de origem não encontrada.',
      });
    }
    if (!toAccount) {
      return res.status(404).json({
        error: 'DESTINATION_NOT_FOUND',
        message: 'Chave Pix de destino não encontrada.',
      });
    }
    if (fromAccount.id === toAccount.id) {
      return res.status(400).json({
        error: 'SAME_ACCOUNT_TRANSFER',
        message: 'Não é possível transferir para a própria conta.',
      });
    }
    if (fromAccount.balance < amount) {
      return res.status(422).json({
        error: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente para realizar a transferência.',
      });
    }

    // 2. Fault injection - simula instabilidade real do provedor Pix
    if (Math.random() < FAULT_INJECTION_RATE) {
      logTransaction(db, {
        fromAccountId,
        toAccountId: toAccount.id,
        amount,
        status: 'FAILED_SIMULATED_FAULT',
      });
      return res.status(500).json({
        error: 'PIX_PROVIDER_UNAVAILABLE',
        message: 'Falha simulada no provedor Pix. Tente novamente.',
      });
    }

    // 3. Executa a transferência (atomicidade simulada: as duas escritas
    // acontecem em sequência síncrona no lowdb, sem outra requisição no meio)
    accounts.find({ id: fromAccount.id }).assign({ balance: fromAccount.balance - amount }).write();
    accounts.find({ id: toAccount.id }).assign({ balance: toAccount.balance + amount }).write();

    const transaction = logTransaction(db, {
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount,
      status: 'COMPLETED',
    });

    return res.status(201).json(transaction);
  });

  return router;
};
