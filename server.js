const express = require('express');
const https = require('https');
const chalk = require('chalk');
const fs = require('fs');
const helmet = require('helmet');
const port = process.env.PORT || 3000;
const pretty = require('express-prettify');
const mongoose = require('mongoose');
const jwt = require('express-jwt');
const jwksrsa = require('jwks-rsa');
const ui = require('swagger-ui-express');
const docs = require('./swagger.json');

require('dotenv').config()

mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true});

require('./models/characters');
require('./models/sagas');

const characters = require('./routes/characters');
const sagas = require('./routes/sagas');

const app = express();

app.use(function(req, res, next){
    res.append('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.append('Access-Control-Allow-Credentials', 'true');
    res.append('Access-Control-Allow-Methods', ['GET', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE']);
    res.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(helmet());

app.use(pretty({ query: 'pretty' }));

app.set('json spaces', 4);

app.use('/swagger', ui.serve, ui.setup(docs));

app.get('/', (req, res, next) => {
    res.send(`Welcome to the dragon ball api, enjoy!`);
});

const jwtcheck = jwt({
    secret: jwksrsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://dev-jsxonkyx.auth0.com/.well-known/jwks.json`
    }),
    audience: 'https://api.dragonball.com',
    issuer: `https://dev-jsxonkyx.auth0.com/`,
    algorithms: ['RS256']
});

app.use(jwtcheck);

app.use('/api/characters', characters);
app.use('/api/sagas', sagas);

https.createServer({
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
    passphrase: process.env.TSL_PASSPHRASE
}, app).listen(port, () => console.log(chalk.blue(`Listening on port ${port}`)));