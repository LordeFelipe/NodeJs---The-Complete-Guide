const express = require('express');
const { check, body } = require('express-validator/check')

const authController = require('../controllers/auth');
const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password', 'Password has to be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

router.post('/signup', [
  check('email')
    .isEmail()
    .withMessage('Please Enter a valid Email')
    .custom((value, {req}) => {
      return User.findOne({email: email})
      .then((userDoc) => {
        if(userDoc) {
          return new Promise.reject('User Already Exists')
        }
      })
    })
    .normalizeEmail(),
  body('password', 'Insira uma senha válida de no min 6 caracteres') //Busca mais especifica no body
    .isLength({min: 5})
    .isAlphanumeric()
    .trim(),
  body('confirmPassword').custom((value, {req}) => {
    if(value !== req.body.password){
      throw new Error('As senhas devem ser iguais')
    }
    return true
  })
  .trim(),
  ],
  authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/reset/:token', authController.postNewPassword);

module.exports = router;