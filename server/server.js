const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-server.json');
const port = 3001;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

/*app.use(cors({
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}));*/

// DB access
const postgres = require('./postgres');

// Request to the database
async function request(query, res) {
  try {
    const client = await postgres.connect();
    try {
      const result = await client.query({
        text: query,
        statement_timeout: 20000
      });
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Errore nella connessione al database o nella query' });
  }
}

// Server port
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Requests to populate filters
// Get all Unimi departments
app.get('/departments', (_, res) => {
  const query = `SELECT id_department, name FROM Department ORDER BY name`;
  request(query, res);
});

// Get all Subfields, degree to select hierarchy (1 = domain, 2 = field, 3 = subfield)
app.get('/domainFieldSubfields', (_, res) => {
  const degree = 3;
  const query = `SELECT id_openalex, name FROM Domain_Field_Subfield WHERE degree = ${degree} ORDER BY name`;
  request(query, res);
});

// Get all Unimi departments
app.get('/openAccessStatuses', (_, res) => {
  const query = `SELECT DISTINCT openaccess_status FROM Work ORDER BY openaccess_status`;
  request(query, res);
});

// Get all sustainable development goals
app.get('/sdgs', (_, res) => {
  const query = `SELECT id_sdg, name FROM Sustainable_Development_Goals ORDER BY name`;
  request(query, res);
});

// Get all Unimi authors
app.get('/authors', (_, res) => {
  const query = `SELECT * FROM Author WHERE role IS NOT NULL ORDER BY surname, name`;
  request(query, res);
});

// Get all institutions
app.get('/institutions', (_, res) => {
  const query = `SELECT id_institution, name FROM Institution ORDER BY name`;
  request(query, res);
});

app.get('/year', async (_, res) => {
  const query = `SELECT MIN(year) AS min_year, MAX(year) AS max_year FROM Work`;
  request(query, res);
});

// First tab request for Unimi collaborations with all other countries
app.get('/unimi/countryCollaborations', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT 
  I.country_code AS country,
  COUNT(DISTINCT AW1.id_work) AS collaboration_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = 1 
  AND AW2.id_institution != AW1.id_institution
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND I.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY I.country_code
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

// First tab request for Unimi collaborations with all other institutions
app.get('/unimi/institutionCollaborations', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT 
  I.name AS institution_name,
  I.country_code AS country,
  COUNT(DISTINCT AW1.id_work) AS collaboration_count,
  SUM(COALESCE(C.count, 0)) AS citation_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  LEFT JOIN Institution AS I ON AW2.id_institution = I.id_institution
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  LEFT JOIN Citation AS C ON C.id_work = AW1.id_work
  WHERE AW1.id_institution = 1 
  AND AW2.id_institution != AW1.id_institution
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY I.name, I.country_code
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

app.get('/unimi/institutionView', (req, res) => {
  const { startYear } = req.query;
  const query = `
  SELECT 
  institution_name,
  country,
  SUM(collaboration_count) AS collaboration_count,
  SUM(citation_count) AS citation_count
  FROM long_query_materialized_view
  WHERE year >= ${startYear}
  GROUP BY institution_name, country
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

// Univeristy of Milan collaborations each year
app.get('/unimi/yearsCollaborations', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT 
  W.year AS year,
  COUNT(DISTINCT AW2.id_institution) AS institution_count,
  COUNT(DISTINCT AW1.id_work) AS collaboration_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = 1 
  AND AW2.id_institution != AW1.id_institution
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY W.year`;
  request(query, res);
});

// Number of collaborating authors of Univeristy of Milan
app.get('/unimi/collaborators', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW2.id_author) AS total_authors
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${institution ? `JOIN Institution AS I ON AW2.id_institution = I.id_institution` : ''}  
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = 1
  AND AW1.id_author != AW2.id_author
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

// Number of collaborations of Univeristy of Milan
app.get('/unimi/collaborations', (req, res) => {
  const { institution, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW1.id_work) AS total_works
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${institution ? `JOIN Institution AS I ON AW2.id_institution = I.id_institution` : ''}  
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = 1
  AND AW1.id_author != AW2.id_author
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

// Institutions collaborating with an author
app.get('/author/institutions', (req, res) => {
  const { id } = req.query;
  const query = `
  SELECT DISTINCT I.id_institution, I.name 
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  WHERE AW1.id_author = ${id}
  AND AW1.id_author != AW2.id_author
  ORDER BY I.name`;
  request(query, res);
});

// Collaborators collaborating with an author
app.get('/author/collaborators', (req, res) => {
  const { id } = req.query;
  const query = `
  SELECT DISTINCT AW2.id_author, A.surname, A.name 
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Author AS A ON AW2.id_author = A.id_author
  WHERE AW1.id_author = ${id}
  AND AW1.id_author != AW2.id_author
  ORDER BY A.surname, A.name`;
  request(query, res);
});

// Countries collaborating with an author
app.get('/author/countries', (req, res) => {
  const { id } = req.query;
  const query = `
  SELECT DISTINCT I.country_code
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  WHERE AW1.id_author = ${id}
  AND AW1.id_author != AW2.id_author
  ORDER BY I.country_code`;
  request(query, res);
});

// University of Milan author's collaborations by country
app.get('/author/countryCollaborations', (req, res) => {
  const { id, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear, institution } = req.query;
  const query = `
      SELECT I.country_code AS country, COUNT(DISTINCT AW1.id_work) AS collaboration_count
      FROM Author_Work AS AW1
      ${department ? `JOIN Author AS A ON AW1.id_author = A.id_author` : ''}
      ${startYear || finishYear || domainFieldSubfield || openAccessStatus || sdg ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I ON AW2.id_institution = I.id_institution
      WHERE AW1.id_author = ${id}
      AND AW1.id_author != AW2.id_author
      ${institution ? `AND I.id_institution = ${institution}` : ''}
      ${department ? `AND A.id_department = ${department}` : ''}
      ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
      GROUP BY I.country_code
      ORDER BY collaboration_count DESC`;
  request(query, res);
});

// University of Milan author's collaborators by country
app.get('/author/countryCollaborators', (req, res) => {
  const { id, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear, collaborator } = req.query;
  const query = `
      SELECT I.country_code AS country, COUNT(DISTINCT AW2.id_institution) AS collaboration_count
      FROM Author_Work AS AW1
      ${department ? `JOIN Author AS A ON AW1.id_author = A.id_author` : ''}
      ${startYear || finishYear || domainFieldSubfield || openAccessStatus || sdg ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I ON AW2.id_institution = I.id_institution
      WHERE AW1.id_author = ${id}
      AND AW1.id_author != AW2.id_author
      ${collaborator ? `AND AW2.id_author = ${collaborator}` : ''}
      ${department ? `AND A.id_department = ${department}` : ''}
      ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
      GROUP BY I.country_code
      ORDER BY collaboration_count DESC`;
  request(query, res);
});

// Number of collaborations of an author
app.get('/author/collaborations', (req, res) => {
  const { id, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear, institution, collaborator } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW1.id_work) AS total_works
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  ${startYear || finishYear || domainFieldSubfield || openAccessStatus || sdg ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_author = ${id}
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${collaborator ? `AND AW2.id_author = ${collaborator}` : ''}
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Number of institutions collaborating with an author
app.get('/author/institutionsCollaborations', (req, res) => {
  const { id, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear, institution } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW2.id_institution) AS institution_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  ${startYear || finishYear || domainFieldSubfield || openAccessStatus || sdg ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_author = ${id}
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Number of collaborators of an author
app.get('/author/collaboratorsCollaborations', (req, res) => {
  const { id, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear, institution } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW2.id_author) AS author_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  ${startYear || finishYear || domainFieldSubfield || openAccessStatus || sdg ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_author = ${id}
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.id_department = ${department}` : ''}
  ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Institutions of a country collaborating with an author
app.get('/author/institutionsCountry', (req, res) => {
  const { id, department, domainFieldSubfield, openAccessStatus, sdg, startYear, finishYear, institution, country } = req.query;
  const query = `
      SELECT I.name AS institution_name, COUNT(DISTINCT AW1.id_work) AS collaboration_count
      FROM Author_Work AS AW1
      ${department ? `JOIN Author AS A ON AW1.id_author = A.id_author` : ''}
      ${startYear || finishYear || domainFieldSubfield || openAccessStatus || sdg ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I ON AW2.id_institution = I.id_institution
      WHERE AW1.id_author = ${id}
      AND I.country_code = '${country}'
      AND AW1.id_author != AW2.id_author
      ${institution ? `AND I.id_institution = ${institution}` : ''}
      ${department ? `AND A.id_department = ${department}` : ''}
      ${domainFieldSubfield ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${domainFieldSubfield}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
      GROUP BY I.name
      ORDER BY collaboration_count DESC`;
  request(query, res);
});