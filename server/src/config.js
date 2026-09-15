const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../server/.env')
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file });
    }
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://danlu:danlu@localhost:5432/danlu_db';
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'change_me';
  }
}

module.exports = { loadEnv };
