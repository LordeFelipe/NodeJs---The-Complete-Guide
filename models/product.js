const mongodb = require('mongodb')
const getDb = require("../util/database").getDb

class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title
    this.description = description
    this.price = price
    this.imageUrl = imageUrl
    this._id = id ? new mongodb.ObjectId(id) : null
    this.userId = userId
  }

  save() {
    const db = getDb();
    let dbOp
    if(this._id){
      dbOp = db.collection('products').updateOne({_id: this._id}, {$set: this})
    }
    else {
      dbOp = db.collection('products').insertOne(this)
    }
    return dbOp
    .then(result => console.log(result))
    .catch(e => console.log(e))
  }

  static fetchAll() {
    const db = getDb();
    //Retorna um cursor
    return db.collection('products').find().toArray()
    .then(products => {
      return products
    })
    .catch(e => console.log(e))
  }

  static findById(prodId) {
    const db = getDb();
    // O next chama o primeiro arquivo da coleção (ou o proximo)
    return db.collection('products').find({_id: new mongodb.ObjectId(prodId)}).next()
    .then(product => {
      return product
    })
    .catch(e => console.log(e))
  }

  static deleteById(prodId) {
    const db = getDb();
    return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)})
    .then(result => {
      console.log('Deleted')
    })
    .catch(e => console.log(e))
  }
}

module.exports = Product