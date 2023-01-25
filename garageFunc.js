const ds = require('./cloudDatastore');
const datastore = ds.datastore;
const GARAGE = ds.GARAGE;
const fromDatastore = ds.fromDatastore;
const af = require('./autoFunc');

// need to pass in req.auth.sub so we can check owner equals 
function get_garages(req, owner) {
    // get collection count
    let count_q = datastore.createQuery(GARAGE).filter('owner.u_id', '=', owner);
    
    // filter returns only matching items from datastore
    let q = datastore.createQuery(GARAGE).filter('owner.u_id', '=', owner).limit(5);
    const results = {};   
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
    return datastore.runQuery(q).then((entities) => {
        return datastore.runQuery(count_q).then((all_entities) => {
            
            results.garages = entities[0].map(fromDatastore);
            results.garages_in_collection = all_entities[0].length;
        
            // MORE_RESULTS_AFTER_LIMIT, NO_MORE_RESULTS
            if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + encodeURIComponent(entities[1].endCursor);
            }
            return results;
        });
        
    });
}

function get_garages_unprotected() {
    let q = datastore.createQuery(GARAGE);
    const results = {};   

    return datastore.runQuery(q).then((entities) => {
        results.items = entities[0].map(fromDatastore);
        return results;
    });
}

function get_garage(id) {
    const key = datastore.key([GARAGE, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}



function post_garage(req, name, location) {
    let key = datastore.key(GARAGE);
    return datastore.save({ "key": key, "data": "" }).then(() => {
        let self = req.protocol + "://" + req.get("host") + req.baseUrl + '/' + key.id;
        const new_garage = {"name": name, "location": location, "cars": [], "owner": null, "self": self};
        return put_garage(key.id, new_garage).then(() => {
            new_garage.id = key.id;
            return new_garage
        });
    });
}

function put_garage(id, data) {
    const key = datastore.key([GARAGE, parseInt(id, 10)]);
    return datastore.save({ "key": key, "data": data });
}

function delete_garage(id) {
    const key = datastore.key([GARAGE, parseInt(id, 10)]);
    return datastore.delete(key);
}

function remove_auto(auto_id, autos){
    for(let i = 0; i < autos.length; i++){
        if (autos[i].id == auto_id){
            autos.splice(i, i+1);
        }
    }
}

function delete_all_references(cars){
    for (let i = 0; i < cars.length; i++){
        af.get_auto(cars[i].id).then((auto) => {
            auto[0].garage_location = null;
            af.put_auto(auto[0].id, auto[0]);
        });
    }
}

module.exports = {get_garages, get_garages_unprotected, get_garage, post_garage, delete_garage, put_garage, remove_auto, delete_all_references}