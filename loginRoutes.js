var router = require('express').Router();
const request = require('request');
const ds = require('./cloudDatastore');
const uf = require('./userFunc');
const gf = require('./garageFunc');

const CLIENT_ID = 'XtyNRhQzvVQi4PCvhIB79zxG7czPOYng';
const CLIENT_SECRET = 'fMRxBgBY12vmncTke1ySRcJlPHru11oyNJAFIXvMdEbHXgzwRynbHZ5_U7ucANns';

router.get('/', function (req, res, next) {
  if (req.oidc.isAuthenticated()){
    uf.post_user(req, req.oidc.user.nickname, req.oidc.user.name, req.oidc.user.sub);

    res.send(`<html> <p>You are logged in.</p><ul><li>JWT: ${req.oidc.idToken}</li><li>Unique ID: ${req.oidc.user.sub}</li></ul></html>`);
  } else {
    res.send('<html> <p>You are not logged in. <a href="/login">Login</a>.</p></html>')
  }
});

router.get('/users', (req, res) => {
    uf.get_users().then((users) => {
        ret_obj = {'users': users.items}        
        res.status(200).send(ret_obj);
    });
});

router.get('/users/:id', (req, res) => {
    uf.get_user(req.params.id).then((user_obj) => {
        let user = user_obj[0];
        if (user === undefined || user === null) {
            res.status(404).json({'Error':'No user with this user_id exists'});
        }
        res.status(200).json(user);
    });
});

router.put('/users/:id/garages/:garage_id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
router.put('/users/:id/garages/:garage_id', (req, res) => {

    uf.get_user(req.params.id).then((userObj) => {
        let user = userObj[0];
        if (user === undefined || user === null) {
            res.status(404).json({'Error':'No user with this user_id exists'});
        } else if (req.auth.sub !== user.unique_id) {
            res.status(403).json({'Error':'Current user not authorized to access this user_id'});
        } else {
            gf.get_garage(req.params.garage_id).then((garageArray) => {
                let garage = garageArray[0];
                if (garage === undefined || garage === null) {
                    res.status(404).json({'Error':'No garage with this garage_id exists'});
                } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
                    res.status(403).json({'Error': 'Current user not authorized to access this resource'})
                } else if (garage.owner !== null) {
                    res.status(403).json({'Error':'Garage already assigned to this user'});
                } else {
                    garage.owner = {'id': user.id, 'u_id': user.unique_id}
                    gf.put_garage(req.params.garage_id, garage).then(() => {
                        user.garages_owned.push({'name': garage.name, 'location': garage.location, 'id': garage.id, 'self': garage.self})
                        uf.put_user(req.params.id, user);
                        res.status(204).send(garage);
                    });
                }
            });
        }
    });
})

// deletes garage from user's owned garages, but doesn't delete the garage itself
router.delete('/users/:id/garages/:garage_id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
router.delete('/users/:id/garages/:garage_id', (req, res) => {
    uf.get_user(req.params.id).then((userObj) => {
        let user = userObj[0];
        if (user === undefined || user === null) {
            res.status(404).json({'Error':'No user with this user_id exists'});
        } else if (req.auth.sub !== user.unique_id) {
            res.status(403).json({'Error':'Current user not authorized to access this user_id'});
        }else {
            gf.get_garage(req.params.garage_id).then((garageArray) => {
                let garage = garageArray[0];
                if (garage === undefined || garage === null) {
                    res.status(404).json({'Error':'No garage with this garage_id exists'});
                } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
                    res.status(403).send({'Error': 'Garage not owned by this user'});
                                    
                } else if (garage.owner == null) {
                    res.status(403).send({'Error': 'Garage not owned'});
                } else {
                    // remove garage from user, and remove owner from garage
                    garage.owner = null;
                    gf.put_garage(garage.id, garage).then(() => {
                        uf.remove_garage(garage.id, user.garages_owned);
                        uf.put_user(user.id, user).then(() => {res.status(204).end()});
                    });                    
                }
            });
        }
    });
});

// for testing
router.delete('/users/:id', (req, res) => {
    uf.delete_users(req.params.id).then(() => {
        res.status(204).end();
    });
})

// login route for testing purposes to get tokens assigned to environment variables
router.post('/users', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    console.log(req.body);

    var options = { method: 'POST',
            url: `https://493-fall-22.us.auth0.com/oauth/token`,
            headers: { 'content-type': 'application/json' },
            body:
             { grant_type: 'password',
               username: username,
               password: password,
               client_id: CLIENT_ID,
               client_secret: CLIENT_SECRET },
            json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

router.get('/user/delete/:id', (req, res) => {
    uf.get_user(req.params.id).then((user_obj) => {
        let user = user_obj[0];
        user.garages_owned = []
        uf.put_user(req.params.id, user).then(() => {
            res.status(200).end();
        });
    });
    
})

module.exports = router;
