const { Datastore } = require('@google-cloud/datastore');

const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

module.exports = Datastore;
module.exports.datastore = new Datastore();
module.exports.GARAGE = "Garage";
module.exports.AUTO = "Automobile";
module.exports.USER = "User";

module.exports.fromDatastore = function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
};

const CLIENT_ID = 'XtyNRhQzvVQi4PCvhIB79zxG7czPOYng';
const CLIENT_SECRET = 'fMRxBgBY12vmncTke1ySRcJlPHru11oyNJAFIXvMdEbHXgzwRynbHZ5_U7ucANns';
const DOMAIN = '493-fall-22.us.auth0.com';

module.exports.checkJwt = jwt({
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