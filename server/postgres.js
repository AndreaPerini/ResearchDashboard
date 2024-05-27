const { Pool } = require('pg');

const postgres = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db_vista',
    password: 'password',
    port: 5432,
    idleTimeoutMillis: 20000,
  });
  
module.exports = postgres;