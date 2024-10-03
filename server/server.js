const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3001;

// DB access
const postgres = require('./postgres');

// Cors options
app.use(cors());

// Server port
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

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

// Middleware to verify query parameters length
function validateQueryParams(req, res, next) {
  const maxLength = 1000; // Max parameters length
  for (let param in req.query) {
    if (req.query[param].length > maxLength) {
      return res.status(400).json({ error: `${param} is too long, max lenght = ${maxLength}.` });
    }
  }
  next();
}

const minutes = 5;
// Middleware to verify cookie
async function validateCookie(req, res, next) {
  if (req.path === '/cookie') {
    return next();
  }
  const { key } = req.query;
  const query = `SELECT * FROM fixed.active_user WHERE key = '${key}' ORDER BY created_at DESC LIMIT 1`;
  try {
    const client = await postgres.connect();
    try {
      const result = await client.query({
        text: query,
        statement_timeout: 20000
      });
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Cookie not found' });
      }
      const date = new Date(result.rows[0].created_at);
      const now = Date.now();
      const diff = now - date;
      if (diff > minutes * 60 * 1000) {
        return res.status(400).json({ error: 'Session expired' });
      } else {
        next();
      }
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Database connection lost' });
  }
}

// Apply the middleware to all routes
app.use(validateQueryParams);
app.use(validateCookie);

// University of Milan id
let UniMi = new Date();
setUnimiId();

async function setUnimiId() {
  const client = await postgres.connect();
  try {
    const result = await client.query({
      text: "SELECT id_institution FROM institution WHERE name = 'University of Milan'",
      statement_timeout: 20000
    });
    UniMi = result.rows[0].id_institution;
  } catch (error) {
    console.error('Error executing query', error);
  } finally {
    client.release();
  }
}

// Request to create the cookie
app.get('/cookie', async (req, res) => {
  const { key } = req.query;
  const user = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const client = await postgres.connect();
    try {
      if (key) {
        const query = `SELECT * FROM fixed.active_user WHERE key = '${key}' ORDER BY created_at DESC LIMIT 1`;
        const result = await client.query({
          text: query,
          statement_timeout: 20000
        });
        if (result.rows.length === 0) {
          generateCookie(client, res, user);
        } else {
          if (result.rows[0].created_at < new Date(Date.now() - minutes * 60 * 1000)) {
            generateCookie(client, res, user);
          } else {
            return res.status(200).json({ message: 'Cookie is still valid', key: key });
          }
        }
      } else {
        generateCookie(client, res, user);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Database connection lost' });
  }
});

async function generateCookie(client, res, user) {
  const key = uuidv4();
  const insertQuery = `INSERT INTO fixed.active_user (key, ip_address, accepted_cookies) VALUES ('${key}', '${user}', true)`;
  await client.query({
    text: insertQuery,
    statement_timeout: 20000
  });
  return res.status(200).json({ message: 'Ok', key: key, expires: minutes });
}

// Request to get the last update date
app.get('/lastUpdate', (req, res) => {
  const query = `SELECT last_update FROM fixed.management_table ORDER BY last_update DESC LIMIT 1`;
  request(query, res);
});

// Requests to populate filters
// Get all Unimi departments
app.get('/department', (req, res) => {
  const { institution, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT DISTINCT A.department AS dipartimento
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Author AS A ON A.id_author = AW1.id_author
  ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_institution = ${UniMi}
  AND AW1.id_author != AW2.id_author
  AND A.department IS NOT NULL
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  ORDER BY A.department`;
  request(query, res);
});

app.get('/departmentView', (req, res) => {
  const query = `SELECT DISTINCT dipartimento FROM openalex_dashboard ORDER BY dipartimento`;
  request(query, res);
});

// Degree for topics hierarchy (1 = domain, 2 = field, 3 = subfield)
const degree = 3;

// Get all topics
app.get('/topic', (req, res) => {
  const { id, institution, department, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT DISTINCT DFS.id_openalex AS id, DFS.name AS name, DFS2.name AS field
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work 
  ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  JOIN Topic_Work AS TW ON TW.id_work = AW1.id_work
  JOIN Topic AS T ON T.id_topic = TW.id_topic
  JOIN Domain_Field_Subfield AS DFS ON T.id_subfield = DFS.id_openalex
  JOIN Domain_Field_Subfield AS DFS2 ON DFS.id_father = DFS2.id_openalex
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  ${id ? `WHERE AW1.id_author = ${id}` : `WHERE AW1.id_institution = ${UniMi}`}
  AND AW1.id_author != AW2.id_author
  AND DFS.degree = ${degree}
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.department = '${department}'` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  ORDER BY DFS.name`;
  request(query, res);
});

app.get('/topicView', (req, res) => {
  const query = `SELECT id, name, field FROM subfield_mv ORDER BY name`;
  request(query, res);
});

// Get all Unimi departments
app.get('/openAccessStatus', (req, res) => {
  const { id, institution, department, topic, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT DISTINCT W.openaccess_status 
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work 
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  ${id ? `WHERE AW1.id_author = ${id}` : `WHERE AW1.id_institution = ${UniMi}`}
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.department = '${department}'` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  ORDER BY W.openaccess_status`;
  request(query, res);
});

app.get('/openAccessStatusView', (req, res) => {
  const query = `SELECT DISTINCT openaccess_status FROM Work ORDER BY openaccess_status`;
  request(query, res);
});

// Get all sustainable development goals
app.get('/sdg', (req, res) => {
  const { id, institution, department, topic, openAccessStatus, startYear, finishYear } = req.query;
  const query = `
  SELECT DISTINCT SDG.id_sdg AS id, SDG.name AS name 
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work 
  ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  JOIN Sdg_Work AS SW ON SW.id_work = AW1.id_work
  JOIN Sustainable_Development_Goals AS SDG ON SDG.id_sdg = SW.id_sdg
  ${id ? `WHERE AW1.id_author = ${id}` : `WHERE AW1.id_institution = ${UniMi}`}
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.department = '${department}'` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  ORDER BY SDG.name`;
  request(query, res);
});

app.get('/sdgView', (req, res) => {
  const query = `SELECT id, name FROM sdg_mv ORDER BY id`;
  request(query, res);
});

// Get all institutions
app.get('/institution', (req, res) => {
  const { department, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT DISTINCT I.id_institution, I.name 
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = ${UniMi}
  AND AW1.id_author != AW2.id_author 
  AND AW1.id_institution != AW2.id_institution
  ${department ? `AND A.department = '${department}'` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  ORDER BY I.name`;
  request(query, res);
});

app.get('/institutionView', (req, res) => {
  const query = `SELECT id_institution, name FROM institution_mv ORDER BY name`;
  request(query, res);
});

app.get('/year', async (req, res) => {
  const { id, institution, department, topic, openAccessStatus, sdg } = req.query;
  const query = `
  ${id ? `
    SELECT MIN(W.year) AS min_year, MAX(W.year) AS max_year
    FROM Author_Work AS AW
    JOIN Work AS W ON W.id_work = AW.id_work
    WHERE AW.id_author = ${id}
    ${topic ? `AND W.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
    ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
    ${sdg ? `AND W.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  `: `
    SELECT MIN(W.year) AS min_year, MAX(W.year) AS max_year 
    FROM Author_Work AS AW1
    JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work 
    JOIN Work AS W ON W.id_work = AW1.id_work
    ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
    WHERE AW1.id_institution = ${UniMi}
    AND AW1.id_author != AW2.id_author
    ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
    ${department ? `AND A.department = '${department}'` : ''}
    ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
    ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
    ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  `}`;
  request(query, res);
});

app.get('/yearView', async (req, res) => {
  const query = `SELECT min_year, max_year FROM year_mv`;
  request(query, res);
});

/**
 * First tab request for Unimi collaborations with all other countries
 * This queries counts only external collaborations, so the institution of the author is different from the institution of the collaborator
 */
app.get('/unimi/countryCollaborations', (req, res) => {
  const { institution, department, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT I.country_code AS country, COUNT(DISTINCT AW1.id_work) AS collaboration_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  JOIN Institution AS I ON AW2.id_institution = I.id_institution
  ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = ${UniMi} 
  AND AW2.id_institution != AW1.id_institution
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND I.id_institution = ${institution}` : ''}  
  ${department ? `AND A.department = '${department}'` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY I.country_code
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

app.get('/unimi/countryView', (req, res) => {
  const { startYear } = req.query;
  const query = `
  SELECT country, SUM(collaboration_count) AS collaboration_count
  FROM country_collaborations_mv
  ${startYear ? `WHERE year >= ${startYear}` : ''}
  GROUP BY country
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

// First tab request for Unimi collaborations with all other institutions
app.get('/unimi/institutionCollaborations', (req, res) => {
  const { institution, department, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT I.name AS institution_name, I.country_code AS country, COUNT(DISTINCT AW1.id_work) AS collaboration_count, SUM(COALESCE(C.count, 0)) AS citation_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  LEFT JOIN Institution AS I ON AW2.id_institution = I.id_institution
  ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  LEFT JOIN Citation AS C ON C.id_work = AW1.id_work
  WHERE AW1.id_institution = ${UniMi} 
  AND AW2.id_institution != AW1.id_institution
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}
  ${department ? `AND A.department = '${department}'` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY I.name, I.country_code
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

app.get('/unimi/institutionCollaborationsView', (req, res) => {
  const { startYear } = req.query;
  const query = `
  SELECT institution_name, country, SUM(collaboration_count) AS collaboration_count, SUM(citation_count) AS citation_count
  FROM institutions_collaborations_mv
  ${startYear ? `WHERE year >= ${startYear}` : ''}
  GROUP BY institution_name, country
  ORDER BY collaboration_count DESC`;
  request(query, res);
});

// Univeristy of Milan collaborations each year
app.get('/unimi/yearsCollaborations', (req, res) => {
  const { institution, department, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT W.year AS year, 
  COUNT(DISTINCT CASE WHEN AW1.id_institution != AW2.id_institution THEN AW2.id_institution END) AS institution_count, 
  COUNT(DISTINCT AW1.id_work) AS collaboration_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
  JOIN Work AS W ON W.id_work = AW1.id_work
  ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
  WHERE AW1.id_institution = ${UniMi} 
  AND AW1.id_author != AW2.id_author
  ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
  ${department ? `AND A.department = '${department}'` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  GROUP BY W.year`;
  request(query, res);
});

app.get('/unimi/yearsView', (req, res) => {
  const { startYear } = req.query;
  const query = `
  SELECT year, collaboration_count, institution_count 
  FROM work_institution_mv
  ${startYear ? `WHERE year >= ${startYear}` : ''}
  `;
  request(query, res);
});

// Number of collaborations, collaborators and institutions involving Univeristy of Milan
app.get('/unimi/collaborations', (req, res) => {
  const { institution, department, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT 
    COUNT(DISTINCT AW1.id_work) AS collaboration_count,
    COUNT(DISTINCT CASE WHEN AW1.id_author != AW2.id_author THEN AW2.id_author END) AS author_count,
    COUNT(DISTINCT CASE WHEN AW1.id_institution != AW2.id_institution THEN AW2.id_institution END) AS institution_count
      FROM Author_Work AS AW1
      JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
      ${openAccessStatus || startYear || finishYear ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      ${department ? `JOIN Author AS A ON A.id_author = AW1.id_author` : ''}
      WHERE AW1.id_institution = ${UniMi}
      AND AW1.id_author != AW2.id_author
      ${institution ? `AND AW2.id_institution = ${institution}` : ''}  
      ${department ? `AND A.department = '${department}'` : ''}
      ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

app.get('/unimi/collaborationsView', (req, res) => {
  const query = `SELECT collaboration_count, author_count, institution_count FROM collaborations_number_mv`;
  request(query, res);
});

// Get all Unimi authors from a department
app.get('/author/authors', (req, res) => {
  const { department } = req.query;
  let query;
  if (department) {
    query = `SELECT * FROM Author WHERE department = '${department}' ORDER BY surname, name`;
  } else {
    query = `SELECT * FROM Author WHERE department IS NOT NULL ORDER BY surname, name`;
  }
  request(query, res);
});

// Get the author info
app.get('/author/info', (req, res) => {
  const { id } = req.query;
  const query = `SELECT * FROM Author WHERE id_author = ${id}`;
  request(query, res);
});

// Collaborators collaborating with an author
app.get('/author/collaborators', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT DISTINCT AW2.id_author, A.surname, A.name 
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  JOIN Author AS A ON AW2.id_author = A.id_author
  ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_author = ${id}
  AND AW1.id_author != AW2.id_author
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  ORDER BY A.surname, A.name`;
  request(query, res);
});

// University of Milan author's collaborations by country
app.get('/author/countryCollaborations', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
      SELECT I.country_code AS country, COUNT(DISTINCT AW1.id_work) AS collaboration_count
      FROM Author_Work AS AW1
      ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I ON AW2.id_institution = I.id_institution
      WHERE AW1.id_author = ${id}
      AND AW1.id_author != AW2.id_author
      ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
      GROUP BY I.country_code
      ORDER BY collaboration_count DESC`;
  request(query, res);
});

// University of Milan author's collaborators by country
app.get('/author/countryCollaborators', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
      SELECT I.country_code AS country, COUNT(DISTINCT AW2.id_author) AS collaborator_count
      FROM Author_Work AS AW1
      ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I ON AW2.id_institution = I.id_institution
      WHERE AW1.id_author = ${id}
      AND AW1.id_author != AW2.id_author
      ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
      GROUP BY I.country_code
      ORDER BY collaborator_count DESC`;
  request(query, res);
});

// Number of collaborations of an author
app.get('/author/collaborations', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear, collaborator } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW1.id_work) AS collaboration_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_author = ${id}
  AND AW1.id_author != AW2.id_author
  ${collaborator ? `AND AW2.id_author = ${collaborator}` : ''}
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Number of collaborators of an author
app.get('/author/collaboratorsCollaborations', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear } = req.query;
  const query = `
  SELECT COUNT(DISTINCT AW2.id_author) AS author_count
  FROM Author_Work AS AW1
  JOIN Author_Work AS AW2 ON AW2.id_work = AW1.id_work
  ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
  WHERE AW1.id_author = ${id}
  AND AW1.id_author != AW2.id_author
  ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
  ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
  ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
  ${startYear ? `AND W.year >= ${startYear}` : ''}
  ${finishYear ? `AND W.year <= ${finishYear}` : ''}
  `;
  request(query, res);
});

// Institutions of a country collaborating with an author
app.get('/author/institutionsCountry', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear, country } = req.query;
  const query = `
      SELECT I.name AS institution_name, COUNT(DISTINCT AW1.id_work) AS collaboration_count
      FROM Author_Work AS AW1
      ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
      JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
      JOIN Institution AS I ON AW2.id_institution = I.id_institution
      WHERE AW1.id_author = ${id}
      AND AW1.id_author != AW2.id_author
      ${country ? `AND I.country_code = '${country}'` : ''}
      ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
      ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
      ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
      ${startYear ? `AND W.year >= ${startYear}` : ''}
      ${finishYear ? `AND W.year <= ${finishYear}` : ''}
      GROUP BY I.name
      ORDER BY collaboration_count DESC`;
  request(query, res);
});

// Collaborators of a country collaborating with an author
app.get('/author/collaboratorsCountry', (req, res) => {
  const { id, topic, openAccessStatus, sdg, startYear, finishYear, country } = req.query;
  const query = `
    SELECT A.surname AS surname, A.name AS name, I.name AS institution_name, COUNT(DISTINCT AW1.id_work) AS collaboration_count
    FROM Author_Work AS AW1
    ${startYear || finishYear || openAccessStatus ? `JOIN Work AS W ON W.id_work = AW1.id_work` : ''}
    JOIN Author_Work AS AW2 ON AW1.id_work = AW2.id_work
    JOIN Institution AS I ON AW2.id_institution = I.id_institution
    JOIN Author AS A ON AW2.id_author = A.id_author
    WHERE AW1.id_author = ${id}
    AND AW1.id_author != AW2.id_author
    AND I.country_code = '${country}'
    ${topic ? `AND AW1.id_work IN (SELECT id_work FROM Topic_Work WHERE id_topic IN (SELECT id_topic FROM Topic WHERE id_subfield = ${topic}))` : ''}
    ${openAccessStatus ? `AND W.openaccess_status = '${openAccessStatus}'` : ''}
    ${sdg ? `AND AW1.id_work IN (SELECT id_work FROM Sdg_Work WHERE id_sdg = ${sdg})` : ''}
    ${startYear ? `AND W.year >= ${startYear}` : ''}
    ${finishYear ? `AND W.year <= ${finishYear}` : ''}
    GROUP BY A.surname, A.name, I.name
    ORDER BY A.surname, A.name, I.name DESC`;
  request(query, res);
});