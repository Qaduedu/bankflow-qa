// pixRoutes.js (v2)
// Simula a logica de negocio de uma transferencia Pix sobre o db.json.
// Nesta versao: autenticacao JWT verificada manualmente (necessario porque
// json-server-auth nao guarda rotas customizadas automaticamente),
// autorizacao (correcao de IDOR), limite noturno, idempotencia, e lock de
// concorrencia por conta. Ver decisions/006, 007 e 008.

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('json-server-auth/dist/constants');
const router = express.Router();

const FAULT_INJECTION_RATE = 0.1;
const NIGHT_LIMIT_AMOUNT = 1000;
const NIGHT_START_HOUR = 20;
const NIGHT_END_HOUR = 6;

function randomDelay(min = 50, max = 400) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );
}

function logTransaction(db, data) {
  const transactions = db.get('transactions');
  const transaction = {
    id: Date.now().toString() + Math.random().toString(16).slice(2, 6),
    ...data,
    timestamp: new Date().toISOString(),
  };
  transactions.push(transaction).write();
  return transaction;
}

function isNightTime(date = new Date()) {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

// Autenticacao manual: confirma que o token existe, e valido, e nao expirou.
// Anexa o payload decodificado (contem "sub", o id do usuario) em req.user.
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token de autenticacao ausente ou mal formatado.',
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET_KEY);
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token invalido ou expirado.',
    });
  }
}

// Lock em memoria por conta - serializa operacoes que leem e escrevem saldo
// da mesma conta, evitando race condition durante o await de latencia.
const accountLocks = new Map();

function withAccountLock(accountId, task) {
  const previous = accountLocks.get(accountId) || Promise.resolve();
  const current = previous.then(task, task);
  accountLocks.set(
    accountId,
    current.catch(() => {})
  );
  return current;
}

module.exports = (db) => {
  router.post('/pix/transfer', authenticate, async (req, res) => {
    const { fromAccountId, pixKey, amount } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!fromAccountId || !pixKey || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'fromAccountId, pixKey e amount (numerico > 0) sao obrigatorios.',
      });
    }

    // Idempotencia: se essa chave ja foi processada, devolve o mesmo
    // resultado anterior em vez de repetir a transferencia.
    if (idempotencyKey) {
      const existing = db.get('transactions').find({ idempotencyKey }).value();
      if (existing) {
        return res.status(200).json({ ...existing, idempotent: true });
      }
    }

    await randomDelay();

    const result = await withAccountLock(fromAccountId, () => {
      const accounts = db.get('accounts');
      const fromAccount = accounts.find({ id: fromAccountId }).value();

      if (!fromAccount) {
        return {
          status: 404,
          body: { error: 'ORIGIN_NOT_FOUND', message: 'Conta de origem nao encontrada.' },
        };
      }
      
      
      // Autorizacao (correcao de IDOR): o dono do token precisa ser o dono
      // da conta de origem, nao basta estar autenticado como alguem.
      {if (String(fromAccount.userId) !== String(req.user.sub)) 
        return {
          status: 403,
          body: {
            error: 'FORBIDDEN',
            message: 'Voce nao tem permissao para transferir a partir desta conta.',
          },
        };
      }

      const toAccount = accounts.find({ pixKey }).value();
      if (!toAccount) {
        return {
          status: 404,
          body: { error: 'DESTINATION_NOT_FOUND', message: 'Chave Pix de destino nao encontrada.' },
        };
      }
      if (fromAccount.id === toAccount.id) {
        return {
          status: 400,
          body: { error: 'SAME_ACCOUNT_TRANSFER', message: 'Nao e possivel transferir para a propria conta.' },
        };
      }
      if (fromAccount.balance < amount) {
        return {
          status: 422,
          body: { error: 'INSUFFICIENT_FUNDS', message: 'Saldo insuficiente para realizar a transferencia.' },
        };
      }
      if (isNightTime() && amount > NIGHT_LIMIT_AMOUNT) {
        return {
          status: 403,
          body: {
            error: 'NIGHT_LIMIT_EXCEEDED',
            message: `Fora do horario comercial (20h-6h), o limite por transferencia e de R$ ${NIGHT_LIMIT_AMOUNT}.`,
          },
        };
      }

      if (Math.random() < FAULT_INJECTION_RATE) {
        logTransaction(db, {
          fromAccountId,
          toAccountId: toAccount.id,
          amount,
          status: 'FAILED_SIMULATED_FAULT',
          idempotencyKey,
        });
        return {
          status: 500,
          body: { error: 'PIX_PROVIDER_UNAVAILABLE', message: 'Falha simulada no provedor Pix. Tente novamente.' },
        };
      }

      accounts.find({ id: fromAccount.id }).assign({ balance: fromAccount.balance - amount }).write();
      accounts.find({ id: toAccount.id }).assign({ balance: toAccount.balance + amount }).write();

      const transaction = logTransaction(db, {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount,
        status: 'COMPLETED',
        idempotencyKey,
      });

      return { status: 201, body: transaction };
    });

    return res.status(result.status).json(result.body);
  });

  return router;
};
