const { Pool } = require('pg');

const postgres = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'researchdb',
    password: 'password',
    port: 5432,
  });
  
module.exports = postgres;