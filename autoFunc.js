const ds = require('./cloudDatastore');
const datastore = ds.datastore;
const AUTO = ds.AUTO;
const fromDatastore = ds.fromDatastore;


function get_autos(req) {
    // get collection count
    let count_q = datastore.createQuery(AUTO);

    let q = datastore.createQuery(AUTO).limit(5);
    const results = {};   
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
    return datastore.runQuery(q).then((entities) => {
        return datastore.runQuery(count_q).then((all_entities) => {

            results.autos = entities[0].map(fromDatastore);
            results.items_in_collection = all_entities[0].length;
            // MORE_RESULTS_AFTER_LIMIT, NO_MORE_RESULTS
            if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + encodeURIComponent(entities[1].endCursor);
            }
            return results;
        });
    });
}

function get_auto(id) {
    const key = datastore.key([AUTO, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            console.log(entity);

            return entity.map(fromDatastore);
        }
    });
}

function post_auto(req, brand, country, year) {
    let key = datastore.key(AUTO);
    return datastore.save({ "key": key, "data": "" }).then(() => {
        let self = req.protocol + "://" + req.get("host") + req.baseUrl + '/' + key.id;
        const new_auto = {"brand": brand, "country": country, "year": year, "garage_location": null, "self": self};
        return put_auto(key.id, new_auto).then(() => {
            new_auto.id = key.id;
            return new_auto});
    });
}

function put_auto(id, data) {
    const key = datastore.key([AUTO, parseInt(id, 10)]);
    return datastore.save({ "key": key, "data": data });
}

function delete_auto(id) {
    const key = datastore.key([AUTO, parseInt(id, 10)]);
    return datastore.delete(key);
}



module.exports = {get_autos, get_auto, post_auto, delete_auto, put_auto}