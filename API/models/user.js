const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    deafult: 'I am new!'
  },
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'post'
  }]
});

module.exports = mongoose.model('User', userSchema);