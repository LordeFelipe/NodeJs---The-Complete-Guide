const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://lordefelipe:100499@cluster0.fp2oy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')
    .then((client) => {
        console.log("Connected!")
        _db = client.db()
        callback(client)
    })
    .catch(e => {
        console.log(e)
        throw e
    })
}

const getDb = () => {
    if(_db) {
        return _db
    }
    throw 'No Database Found'
}

exports.mongoConnect = mongoConnect
exports.getDb = getDb