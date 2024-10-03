const { Pool } = require('pg');

const postgres = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dashdb',
  password: 'password',
  port: 5432,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 2000
});

module.exports = postgres;