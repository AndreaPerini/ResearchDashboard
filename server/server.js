const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-server.json');
const port = 3000;
const { Pool } = require('pg');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

// DB access
const postgres = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'chimica',
  password: 'password',
  port: 5432,
});

// Request to the database
function request(query, res) {
  postgres.query(query, (error, results) => {
    if (error) {
      console.error('Errore: ', error);
      res.status(500).json({ error: 'Errore' });
    } else {
      res.json(results.rows);
    }
  });
}

// Server port
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Requests to populate filters
// Get all Unimi departments
app.get('/departments', (req, res) => {
  const query = `SELECT * FROM Department ORDER BY name`;
  request(query, res);
});

// Get all Subfields, degree to select hierarchy (1 = domain, 2 = field, 3 = subfield)
app.get('/domainFieldSubfields', (req, res) => {
  const degree = 3;
  const query = `SELECT * FROM Domain_Field_Subfield WHERE degree = ${degree} ORDER BY name`;
  request(query, res);
});

// Get all Unimi departments
app.get('/openAccessStatuses', (req, res) => {
  const query = `SELECT DISTINCT openaccess_status FROM Work ORDER BY openaccess_status`;
  request(query, res);
});

// Get all sustainable development goals
app.get('/sdgs', (req, res) => {
  const query = `SELECT * FROM Sustainable_Development_Goals ORDER BY name`;
  request(query, res);
});

// Get all Unimi authors
app.get('/authors', (req, res) => {
  const query = `SELECT * FROM Author WHERE role IS NOT NULL ORDER BY surname, name`;
  request(query, res);
});

// Get all institutions
app.get('/institutions', (req, res) => {
  const query = `SELECT * FROM Institution ORDER BY name`;
  request(query, res);
});

// First tab request for Unimi collaborations with all other institutions
app.get('/institutionCollaborations', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT 
  I.name AS institution_name,
  I.country_code AS country,
  W.year AS year,
  COUNT(DISTINCT AW1.id_work) AS collaboration_count,
  SUM(COALESCE(C.count, 0)) AS citation_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  JOIN Work AS W ON W.id_work = AW1.id_work
  JOIN Author AS A ON A.id_author = AW1.id_author
  LEFT JOIN Citation AS C ON C.id_work = AW1.id_work
  WHERE AW1.id_institution = 1 
  AND AW2.id_institution != AW1.id_institution
  ${institution ? `AND I.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY I.name, I.country_code, W.year
  ORDER BY collaboration_count DESC;`;
  request(query, res);
});

// Number of collaborating authors
app.get('/collaborators', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW2.id_author) AS total_authors
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  JOIN Work AS W ON W.id_work = AW1.id_work
  JOIN Author AS A ON A.id_author = AW1.id_author
  WHERE AW1.id_institution = 1
  ${institution ? `AND I.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Number of collaborations
app.get('/collaborations', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW1.id_work) AS total_works
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  JOIN Work AS W ON W.id_work = AW1.id_work
  JOIN Author AS A ON A.id_author = AW1.id_author
  WHERE AW1.id_institution = 1
  ${institution ? `AND I.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Second tab request for Unimi author collaborations by country
app.get('/authorCollaborations', (req, res) => {
  const { id, domainFieldSubfield, openAccessStatus, sdg } = req.query;
  const query = `
      SELECT I2.name AS institution_name, I2.country_code AS country, COUNT(DISTINCT AW1.id_work) AS collaboration_count
      FROM Author_Work AS AW1
      JOIN Institution AS I1 ON AW1.id_institution = I1.id_institution
      JOIN Author AS A ON AW1.id_author = A.id_author
      JOIN Work AS W ON W.id_work = AW1.id_work
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I2 ON AW2.id_institution = I2.id_institution
      ${id ? `WHERE A.id_author = ${id}` : ''}
      ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      GROUP BY I2.name, I2.country_code
      ORDER BY collaboration_count DESC`;
  request(query, res);
});