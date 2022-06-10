const express = require('express')
const { body } = require('express-validator/check')

const feedController = require('../controller/feed')
const isAuth = require('../middleware/is-auth')

const router = express.Router()

router.get('/posts', isAuth, feedController.getPosts)
router.post('/post', [
  body('title').trim().isLength({min:5}),
  body('content').trim().isLength({min:5})
], feedController.createPost)

router.get('/post/:id', isAuth, feedController.getPost)

router.put('/post/:id', [
  body('title').trim().isLength({min:5}),
  body('content').trim().isLength({min:5})
], isAuth, feedController.updatePost)

router.delete('/post/:id',  isAuth, feedController.deletePost)

module.exports = router