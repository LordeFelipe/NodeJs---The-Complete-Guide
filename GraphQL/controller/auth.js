const fs = require('fs')
const path = require('path')

const {validationResult} = require('express-validator/check')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

exports.signup = (req, res, next) => {
  
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    const error = new Error('Validation failed')
    error.statusCode = 422
    error.data = errors.array()
    throw error
  }
  
  const email = req.body.email
  const name = req.body.name
  const password = req.body.password

  bcrypt.hash(password,12)
  .then(hashedPassword => {
    const user = new User({
      email: email,
      name: name,
      password: hashedPassword
    })
    return user.save()
  })
  .then(user => {
    res.status(201).json({
      userId: result._id
    })
  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })
}

exports.login = (req, res, next) => {
  
  const email = req.body.email
  const password = req.body.password
  let loadedUser

  User.findOne({email: email})
  .then(user => {
    if(!user){
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }
    loadedUser = user
    return bcrypt.compare(password, user.password)
  })
  .then(isEqual => {
    if(!isEqual){
      const error = new Error('Wrong Password')
      error.statusCode = 401
      throw error
    }
    const token = jwt.sign({
      email: loadedUser.email, 
      userId: loadedUser._id.toString()
    }, 'secret', {expiresIn: '1h'}) //Secret é o codigo para criptografar

    res.status(200).json({token: token, userId: loadedUser._id.toString()})

  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })
}

