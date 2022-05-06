const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const mailjetTransport = require('nodemailer-mailjet-transport')

const User = require('../models/user');

const transporter = nodemailer.createTransport(mailjetTransport({
  auth: {
    apiKey: 'key',
    apiSecret: 'secret'
  }
}))

exports.getLogin = (req, res, next) => {
  let message = req.flash('error')
  if(message.length > 0) {
    message = message[0]
  }
  else {
    message = null
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error')
  if(message.length > 0) {
    message = message[0]
  }
  else {
    message = null
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  User.findOne({email: email})
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password')
        return res.redirect('/login')
      }
      bcrypt.compare(password, user.password)
      .then((doMatch) => {
        if(doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.save(err => {
            res.redirect('/')
          });
        }
        else {
          req.flash('error', 'Invalid email or password')
          res.redirect('/login')
        }
      })
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  User.findOne({email: email})
  .then((userDoc) => {
    if(userDoc) {
      req.flash('error', 'User Already Exists')
      return res.redirect('/signup')
    }
    return bcrypt.hash(password, 12) //12 é o salt
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {items: []}
      })
      return user.save()
    })
    .then(() => {
      res.redirect('/login')
      return transporter.sendMail({
        to: email,
        from: 'shop@node-complete.com',
        subject: 'Signup Deu bom!',
        html: '<h1>Deu certo!</h1>'
      })
    })
  })
  .catch(e => console.log(e))
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
