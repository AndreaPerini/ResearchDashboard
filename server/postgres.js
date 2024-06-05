const { Pool } = require('pg');

const postgres = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'db_vista',
  password: 'password',
  port: 5432,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 2000,
  max: 20,
});

module.exports = postgres;