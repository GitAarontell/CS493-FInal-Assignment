const express = require('express');
const routerGarage = express.Router();
const gf = require('./garageFunc');
const af = require('./autoFunc');
const ds = require('./cloudDatastore');
const uf = require('./userFunc');

routerGarage.get('/', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.get('/', function (req, res) {
    if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    } else {
        gf.get_garages(req, req.auth.sub).then((garages) => {
                //let retObj = {"garages": garages.items, "garages_in_collection": garages.items_in_collection, "next": garages.next};          
                res.status(200).json(garages);
        });
    }
});

// for testing
routerGarage.get('/unprotected', function (req, res) {
    gf.get_garages_unprotected().then((garages) => {
            let retObj = {"garages": garages.items};          
            res.status(200).json(retObj);
    });
});



routerGarage.get('/:id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.get('/:id', function (req, res) {
    garage_id = req.params.id;
    gf.get_garage(garage_id).then(garageArray => {
        let garage = garageArray[0]
        if (garage === undefined || garage === null) {
            res.status(404).json({'Error':'No garage with this garage_id exists'});
        } else if (garage.owner === null) {
            // if there is no owner, then it is not considered protected
            res.status(200).json(garage);
        } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
            res.status(403).send({'Error': 'Current user not authorized to access this resource'})
        } else if (req.get('accept') !== 'application/json'){
            res.status(406).json({"Error": "Server can only send application/json data"})
        } else {
            res.status(200).json(garage);
        }
    });
});

routerGarage.post('/', function (req, res) {

    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }

    // checks if accepts json data
    if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    }
    else if (Object.keys(req.body).length == 2) {

        // check for correct attribute keys
        let keys = Object.keys(req.body);
        if (JSON.stringify(keys) !== JSON.stringify(['name', 'location'])) {
            res.status(400).json({"Error": "The request object is missing at least one of the required attributes or the attributes are not set in the right order"});
        } else {
            gf.post_garage(req, req.body.name, req.body.location).then(garage => {
                res.status(201).json(garage);
            });
        }
    } else {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes"});
    }
});

routerGarage.put('/:id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.put('/:id', function (req, res) {
   
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }

    // checks if accepts json data
    if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    }

    let keys = Object.keys(req.body);

    // checks if there are only 3 attributes
    if (keys.length != 2) {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes"});
    }

    // checks if the attributes have the right key names and are in the right order
    if (JSON.stringify(keys) !== JSON.stringify(['name', 'location'])) {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes or the attributes are not set in the right order"});
    }

    gf.get_garage(req.params.id).then((garageArray) => {
        let garage = garageArray[0];
        if (garage === undefined || garage === null){
            res.status(404).json({"Error": "The specified garage does not exist"});
        // if the garage is null, then is should technically not be a protected resource and so anyone can 
        // access it
        } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
            res.status(403).send({'Error': 'Current user not authorized to access this resource'})
        }

        // edit the garage object's name and location with new values
        garage.name = req.body.name;
        garage.location = req.body.location;

        // save updated garage object in datastore
        gf.put_garage(req.params.id, garage).then( ()=> {
            if (garage.owner !== null) {
                // update user with new garage changes
                uf.get_user(garage.owner.id).then((user_obj) => {
                    let user = user_obj[0];
                    uf.remove_garage(garage.id, user.garages_owned);
                    user.garages_owned.push({'name': garage.name, 'location': garage.location, 'id': garage.id, 'self': garage.self});
                    uf.put_user(user.id, user);
                });
            }
            res.status(204).json(garage);
        });
    });                      
});

routerGarage.put('/:id/autos/:auto_id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.put('/:id/autos/:auto_id', function (req, res) {
    let auto_id = req.params.auto_id;
    let id = req.params.id;
    
    gf.get_garage(id).then((garageObj) => {
        let garage = garageObj[0];
        if (garage === undefined || garage === null){
            res.status(404).send({"Error": "The specified garage does not exist"});
        } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
            res.status(403).send({'Error': 'Current user not authorized to access this resource'})
        }

        af.get_auto(auto_id).then((autoObj) => {
            let auto = autoObj[0];
            if (auto == undefined || auto == null) {
                res.status(404).json({"Error": "The specified auto does not exist"});
            }
            if (auto.garage_location == null) {                     
                //delete auto.id;
                auto.garage_location = {"id": id, "name": garage.name, "self": garage.self}
                af.put_auto(auto_id, auto).then(()=> {
                    garage.cars.push(auto);
                    gf.put_garage(id, garage).then(() => {
                        res.status(204).end();
                    });                   
                });                   
            } else {
                res.status(403).json({"Error": "The auto is already in another garage"});
            }
        });
    });
});


routerGarage.patch('/:id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.patch('/:id', function (req, res) {

    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }

    // checks if accepts json data
    if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    }

    let keys = Object.keys(req.body);

    // checks if there are only 2 attributes max and greater than 0
    if (keys.length < 1 || keys.length > 2) {
        res.status(400).json({"Error": "The request object has too many or too little attributes"});
    }

    gf.get_garage(req.params.id).then((garageArray) => {
        let garage = garageArray[0];
        if (garage === undefined || garage === null){
            res.status(404).json({"Error": "The specified garage does not exist"});
        } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
            res.status(403).send({'Error': 'Current user not authorized to access this resource'})
        } 

        // update attribute if it was input in the body
        if ("name" in req.body){garage["name"] = req.body.name;}
        if ("location" in req.body){garage["location"] = req.body.location;}

        // save updated garage object in datastore
        gf.put_garage(req.params.id, garage).then(()=> {
            if (garage.owner !== null) {
                // update user with new garage changes
                uf.get_user(garage.owner.id).then((user_obj) => {
                    let user = user_obj[0];
                    uf.remove_garage(garage.id, user.garages_owned);
                    user.garages_owned.push({'name': garage.name, 'location': garage.location, 'id': garage.id, 'self': garage.self});
                    uf.put_user(user.id, user);
                });
            }
            res.status(204).json(garage);
        });
    });
                     
});

routerGarage.delete('/:id', ds.checkJwt, function(err, req, res, next){
    if (err){
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.delete('/:id', function (req, res) {
    gf.get_garage(req.params.id).then((gArray) => {
        let garage = gArray[0];
        if (garage === undefined || garage === null){
            res.status(404).send({"Error": "No garage with this garage_id exists"});
        } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
            res.status(403).send({'Error': 'Current user not authorized to access this resource'});
        } else {
            // sets all garage_locations of cars in this garage to null
            if (garage.cars.length > 0) {
                gf.delete_all_references(garage.cars);
            }

            if (garage.owner !== null){
                uf.get_user(garage.owner.id).then((user_obj) => {
                    let user = user_obj[0];
                    uf.remove_garage(req.params.id, user.garages_owned);
                    uf.put_user(user.id, user);
                });
            }
            // delete garage
            gf.delete_garage(req.params.id).then(() => {
                res.status(204).end();
            });
        }
    });     
});

routerGarage.delete('/:id/autos/:auto_id', ds.checkJwt, function(err, req, res, next){
    if (err){
        //console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});
routerGarage.delete('/:id/autos/:auto_id', function (req, res) {
    let id = req.params.id;
    let auto_id = req.params.auto_id;

    // get garage by id
    gf.get_garage(id).then((garageArray) => {
        let garage = garageArray[0];
        // if garage does not exist throw 404 error
        if (garage === undefined || garage === null){
            res.status(404).send({"Error": "No garage with this garage_id exists"});
        } else if (garage.owner !== null && garage.owner.u_id !== req.auth.sub){
            res.status(403).send({'Error': 'Current user not authorized to access this resource'})    
        } else {
            // get auto by id
            af.get_auto(auto_id).then((autoArray) => {
                let auto = autoArray[0];

                if (autoArray[0] === undefined || autoArray[0] === null) {
                    res.status(404).send({"Error": "No auto with this auto_id exists"});
                } else {
                    if (auto.garage_location == null || auto.garage_location.id != id){res.status(404).send(
                        {"Error":"No garage with this garage_id has the auto with this auto_id"});
                    }
                    // set the auto object garage_location to null
                    auto.garage_location = null;
                    // update auto to have no garage_location
                    af.put_auto(auto_id, auto).then(() => {
                        // take auto with matching id object out of garages object autos
                        gf.remove_auto(auto_id, garage.cars);
                        // update garage with new autos value and send status
                        gf.put_garage(id, garage).then(() => {res.status(204).end();});
                    });
                }   
            });
        }
    });
});

routerGarage.delete('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

routerGarage.put('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

module.exports = routerGarage;