const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization')
  if(!authHeader) {
    req.isAuth = false;
    return next()
  }
  const token = authHeader.split(' ')[1] //Separando pq vem com o Bearer
  let decodedToken

  try {
    decodedToken = jwt.verify(token, 'secret')
  }
  catch (err) {
    req.isAuth = false;
    return next()
  }

  if(!decodedToken) {
    req.isAuth = false;
    return next()
  }

  req.userId = decodedToken.userId
  req.isAuth = true
  next()
}
