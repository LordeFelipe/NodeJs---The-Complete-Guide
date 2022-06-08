const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const mailjetTransport = require('nodemailer-mailjet-transport')
const {validationResult} = require('express-validator/check')

const User = require('../models/user');

// const transporter = nodemailer.createTransport(mailjetTransport({
//   auth: {
//     apiKey: 'key',
//     apiSecret: 'secret'
//   }
// }))

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
    errorMessage: message,
    oldInput: {email: "", password: ""},
    validationErrors: []
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
    errorMessage: message,
    oldInput: {email: "", password: "", confirmPassword: ""},
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password

  const errors = validationResult(req)

  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {email: email, password: password},
      validationErrors: errors.array()
    });
  }

  User.findOne({email: email})
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput: {email: email, password: password},
          validationErrors: []
        });
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
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password',
            oldInput: {email: email, password: password},
            validationErrors: []
          });
        }
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatus = 500
      return next(error)
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const errors = validationResult(req)

  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {email: email, password: password, confirmPassword: req.body.confirmPassword},
      validationErrors: errors.array()
    });
  }

  bcrypt.hash(password, 12) //12 é o salt
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
    // return transporter.sendMail({
    //   to: email,
    //   from: 'shop@node-complete.com',
    //   subject: 'Signup Deu bom!',
    //   html: '<h1>Deu certo!</h1>'
    // })
  })
  
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error')
  if(message.length > 0) {
    message = message[0]
  }
  else {
    message = null
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err){
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex')
    User.findOne({email: req.body.email})
    .then((user) => {
      if(!user){
        req.flash('error', 'COnta nao existe')
        return req.redirect('/reset')
      }
      else {
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 3600000
        return user.save()
      }
    })
    .then(() => {
      res.redirect('/')
      // transporter.sendMail({
      //   to: req.body.email,
      //   from: 'shop@node-complete.com',
      //   subject: 'Password Reset',
      //   html: `
      //     Link para setar o novo password:
      //     <a href="http://localhost:3000/reset/${token}"></a>
      //   `
      // })
    })
  })
}

exports.getNewPassword = (req, res, next) => {
  let message = req.flash('error')
  const token = req.params.token
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}}) //greater than
  .then((user) => {
    if(message.length > 0) {
      message = message[0]
    }
    else {
      message = null
    }
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token
    });
  })
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password
  const userId = req.body.userId
  const passwordToken = req.body.passwordToken
  let resetUser

  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId}) //greater than
  .then(user => {
    resetUser = user
    return bcrypt.hash(newPassword, 12)
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword
    resetUser.resetToken = undefined
    resetUser.resetTokenExpiration = undefined
    return resetUser.save()
  })
  .then(result => {
    res.redirect('/login')
  })
}