const express = require('express');
const routerAuto = express.Router();
const af = require('./autoFunc');
const gf = require('./garageFunc');

routerAuto.get('/', function (req, res) {
    // checks if accepts json data
    if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    } else {    
        af.get_autos(req).then((autos) => {
                //let retObj = {"autos": autos.items, "next": autos.next};          
                res.status(200).json(autos);
        });
    }
});

routerAuto.get('/:id', function (req, res) {
    if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    } else {
        auto_id = req.params.id;
        af.get_auto(auto_id).then(autoArray => {
            let auto = autoArray[0]
            if (auto === undefined || auto === null) {
                res.status(404).json({'Error':'No auto with this auto_id exists'});
            }
            
            res.status(200).json(auto);
        });
    }
});

routerAuto.post('/', function (req, res) {

    if (req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }

    // checks if accepts json data
    else if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    }
    else if (Object.keys(req.body).length == 3) {

        // check for correct attribute keys
        let keys = Object.keys(req.body);

        if (JSON.stringify(keys) !== JSON.stringify(['brand', 'country', 'year'])) {
            res.status(400).json({"Error": "The request object is missing at least one of the required attributes or the attributes are not set in the right order"});
        } else {
            af.post_auto(req, req.body.brand, req.body.country, req.body.year).then(auto => {
                res.status(201).json(auto);
            });
        }
    } else {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes"});
    }
});

routerAuto.put('/:id', function (req, res) {
    let keys = Object.keys(req.body);
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    } else if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    }else if (keys.length != 3) {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes"});
    } else if (JSON.stringify(keys) !== JSON.stringify(['brand', 'country', 'year'])) {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes or the attributes are not set in the right order"});
    } else {
        af.get_auto(req.params.id).then((autoArray) => {
            let auto = autoArray[0];
            if (auto === undefined || auto === null){
                res.status(404).json({"Error": "The specified auto does not exist"});
            }

            // edit the gaage object's name and location with new values
            auto.brand = req.body.brand;
            auto.country = req.body.country;
            auto.year = req.body.year;

            // save updated auto object in datastore
            af.put_auto(req.params.id, auto).then( ()=> {
                res.status(204).json(auto);
            });
        }); 
    }                     
});

routerAuto.patch('/:id', function (req, res) {
    let keys = Object.keys(req.body);
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    } else if (req.get('accept') !== 'application/json'){
        res.status(406).json({"Error": "Server can only send application/json data"})
    } else if (keys.length < 1 || keys.length > 3) {
        res.status(400).json({"Error": "The request object has too many or too little attributes"});
    } else {
        af.get_auto(req.params.id).then((autoArray) => {
            let auto = autoArray[0];
            if (auto === undefined || auto === null){
                res.status(404).json({"Error": "The specified auto does not exist"});
            }

            // update attribute if it was input in the body
            if ("brand" in req.body){auto["brand"] = req.body.brand;}
            if ("country" in req.body){auto["country"] = req.body.country}
            if ("year" in req.body){auto["year"] = req.body.year;}

            // save updated auto object in datastore
            af.put_auto(req.params.id, auto).then(()=> {
                res.status(204).json(auto);
            });
        });
    }         
});

routerAuto.delete('/:id', function (req, res) {

    af.get_auto(req.params.id).then((gArray) => {
        let auto = gArray[0];
        if (auto === undefined || auto === null){
            res.status(404).send({"Error": "No auto with this auto_id exists"});
        }
        
        if (auto.garage_location !== null) {
            gf.get_garage(auto.garage_location.id).then((gArray) => {
                garage = gArray[0];
                gf.remove_auto(auto.id, garage.cars);
                gf.put_garage(garage.id, garage);
            });
        }
        // delete auto
        af.delete_auto(req.params.id).then(
            res.status(204).end())
        });
});

routerAuto.delete('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

routerAuto.put('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

module.exports = routerAuto;