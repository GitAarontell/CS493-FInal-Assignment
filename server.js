const express = require('express');
const path = require('path');
const { auth } = require('express-openid-connect');
const bodyParser = require('body-parser');

const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const router = require('./loginRoutes');
const garageRouter = require('./garageRoutes');
const autoRouter = require('./autoRoutes');

const port = process.env.PORT || 8000;
const app = express();


app.use(express.json());
app.enable('trust proxy');
app.use(bodyParser.json());

const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: 'https://final-bertella.wn.r.appspot.com',
    clientID: 'XtyNRhQzvVQi4PCvhIB79zxG7czPOYng',
    issuerBaseURL:'https://493-fall-22.us.auth0.com',
    secret:'a long, randomly-generated string stored in env'
};

const CLIENT_ID = 'XtyNRhQzvVQi4PCvhIB79zxG7czPOYng';
const CLIENT_SECRET = 'fMRxBgBY12vmncTke1ySRcJlPHru11oyNJAFIXvMdEbHXgzwRynbHZ5_U7ucANns';
const DOMAIN = '493-fall-22.us.auth0.com';

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
});

app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function (req, res, next) {
    res.locals.user = req.oidc.user;
    //console.log(res.locals)
    next();
});

app.use('/', router);
app.use('/garages', garageRouter);
app.use('/autos', autoRouter);

// app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Server listening...`);
});
