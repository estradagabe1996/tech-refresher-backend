const pgp = require('pg-promise')();
const winston = require('winston');
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerJsDocs = YAML.load('./api.yaml');
const path = require('path');
const bodyParser = require("body-parser"); // for parsing application/json
const app = express();
const db = pgp("postgres://kugfhzwa:XDEvpJvLkLV3cPozzlgmC2L9PRM5BJCw@ruby.db.elephantsql.com/kugfhzwa");

 
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); 

app.use(bodyParser.json());
app.use("/api-docs", swaggerUI.serve,swaggerUI.setup(swaggerJsDocs));




const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
});

function clientError (req, message, errorCode) {
  logger.log({
    level: 'info',
    endpoint: req.path,
    method: req.method,
    query: req.query,
    pathParameters: req.params,
    body: req.body,
    ip: req.ip,
    error: errorCode,
    message: message,
    timestamp: new Date().toUTCString(),
  });
}





let clientID = 0;
app.all('/*', (req, res, next) => {
  clientID++;
  logger.log({
    level: 'info',
    endpoint: req.path,
    method: req.method,
    query: req.query,
    pathParameters: req.params,
    body: req.body,
    ip: req.ip,
    timestamp: new Date().toUTCString(),
  });
  next()
    
})

/*
Endpoint:
    GET endpoint for fetching tech cards
*/

app.get('/', async (req, res) => {
  res.json({ message: 'Welcome to the tech-refresher-backend API' });
});

app.get('/tech', async (req, res) => {
  res.json(await db.many('SELECT * FROM tech ORDER BY RANDOM() LIMIT 10'))
});


/*
Endpoint:
    GET endpoint for users login
*/
app.get('/login', async (req, res) => {
  res.json(await db.many('SELECT * FROM login_test'))
});

/*
Endpoint:
    POST
*/
app.post('/tech', async (req, res) => {
  
  console.log(req.body)
  
  await db.none('INSERT INTO tech(question, answer) VALUES($1, $2)',
  [req.body.question, req.body.answer]);
  res.json({question: req.body.question, answer: req.body.answer})
});


/*
Endpoint:
  PATCH
*/

app.patch('/tech', (req, res) => {
  
});

/*
Endpoint:
  DELETE
*/

app.delete('/tech/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.oneOrNone('DELETE FROM tech WHERE id = $1', [id]);
        res.json({ message: `Tech data with ID ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting tech data:', error.message);
        clientError(req, `Failed to delete tech data with ID ${id}`, 500); // Log client error
        res.status(500).json({ message: 'Failed to delete tech data' });
    }
});

app.listen(3003, () => {
    console.log('Server is running on port 3003');
});
module.exports = app