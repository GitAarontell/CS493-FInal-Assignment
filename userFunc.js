const ds = require('./cloudDatastore');
const datastore = ds.datastore;
const USER = ds.USER;
const fromDatastore = ds.fromDatastore;


function get_users() {
    let q = datastore.createQuery(USER);
    const results = {};   

    return datastore.runQuery(q).then((entities) => {
        results.items = entities[0].map(fromDatastore);
        return results;
    });
}

function get_user(id) {
    const key = datastore.key([USER, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}

function post_user(req, name, email, uID) {
    get_users().then((users) => {
        if (check_user_exists(uID, users.items)){
            return;
        } else {
            let key = datastore.key(USER);
            return datastore.save({ "key": key, "data": "" }).then(() => {
                let self = req.protocol + "://" + req.get("host") + req.baseUrl + '/users/' + key.id;
                let new_user = {"name": name, "email": email, "unique_id": uID, "garages_owned": [], 'self': self}
                return put_user(key.id, new_user).then(() => {
                    new_user.id = key.id;
                    return new_user
                });
            });
        }
    })
}

function put_user(id, data) {
    const key = datastore.key([USER, parseInt(id, 10)]);
    return datastore.save({ "key": key, "data": data });
}

function check_user_exists(uID, users){
    for (let i = 0; i < users.length; i++){
        if (users[i].unique_id === uID){
            return true;
        }
    }
    return false;
}

function delete_users(id) {
    const key = datastore.key([USER, parseInt(id, 10)]);
    return datastore.delete(key);
}

function remove_garage(garage_id, garages){
    for(let i = 0; i < garages.length; i++){
        if (garages[i].id == garage_id){
            garages.splice(i, i+1);
        }
    }
}

module.exports = {get_users, get_user, post_user, put_user, delete_users, remove_garage}