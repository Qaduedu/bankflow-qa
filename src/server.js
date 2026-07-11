const jsonServer = require('json-server');
const auth = require('json-server-auth');
const pixRoutes = require('./pixRoutes');

const server = jsonServer.create();
const router = jsonServer.router('src/db.json');
const middlewares = jsonServer.defaults();

server.db = router.db;
server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(auth);
server.use(pixRoutes(server.db));
server.use(router);

server.listen(3000, () => console.log('BankFlow QA API rodando em http://localhost:3000'));
server.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});