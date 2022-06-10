const express = require('express')
const { body } = require('express-validator/check')

const authController = require('../controller/auth')

const User = require('../models/user')

const router = express.Router()

router.put('/signup', [
  body('email')
  .isEmail()
    .withMessage('Please Enter a valid Email')
    .custom((value, {req}) => {
      return User.findOne({email: value})
      .then((userDoc) => {
        if(userDoc) {
          return Promise.reject('User Already Exists')
        }
      })
    })
    .normalizeEmail(),
  body('password', 'Insira uma senha válida de no min 6 caracteres') //Busca mais especifica no body
    .isLength({min: 5})
    .trim(),
], authController.signup)

router.post('/login', authController.login)

module.exports = router