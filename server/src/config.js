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
    process.env.DATABASE_URL = 'postgresql://database_dan:eUbsKVEmdMrUJOv9UeTEl2PJp14v0MiZ@dpg-dajrb3qd0e5s73deq8f0-a.oregon-postgres.render.com/db_001_init_sql';
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'change_me';
  }
}

module.exports = { loadEnv };
