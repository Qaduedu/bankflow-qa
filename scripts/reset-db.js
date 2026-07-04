const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'src', 'db.seed.json');
const dbPath = path.join(__dirname, '..', 'src', 'db.json');

fs.copyFileSync(seedPath, dbPath);
console.log('db.json restaurado ao estado inicial (a partir de db.seed.json)');
