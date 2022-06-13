const fs = require('fs')
const path = require('path')

const {validationResult} = require('express-validator/check')

const io = require('../socket')

const Post = require('../models/post')
const User = require('../models/user')

exports.getPosts = async (req, res, next) => {
  
  const currentPage = req.query.page || 1
  const perPage = 2

  try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find().populate('creator').sort({createdAt: -1}).skip((currentPage - 1)*perPage).limit(perPage)
  
    res.status(200).json({
      posts: posts, totalItems: totalItems
    })
  }
  catch (e) {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  }
}

exports.getPost = (req, res, next) => {
  const id = req.params.id

  Post.findById(id)
  .then(post => {
    if(!post) {
      const error = new Error('Could not find post')
      error.statusCode = 404
      throw error
    }
    res.status(200).json({
      post: {post: post}
    })
  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })
}

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    const error = new Error('Validation failed')
    error.statusCode = 422
    throw error
  }

  if(!req.file) {
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }

  const imageUrl = req.file.path
  const title = req.body.title
  const content = req.body.content

  const post = new Post({
    title: title, 
    content: content, 
    imageUrl: imageUrl,
    creator: req.userId, 
  })

  try {
    await post.save()
    const creator = await User.findById(req.userId)
    creator.posts.push(post)
    await creator.save()
    io.getIO().emit('posts', {action: 'create', post: {...post._doc, creator: {_id: req.userId, name: creator.name}}}) //manda uma msg pra todos os users conectados
  
    res.status(201).json({
      message: 'Post created successfully',
      post: post,
      creator: {_id: creator._id, name: creator.name}
    })
  }
  catch (e) {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  }
}

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    const error = new Error('Validation failed')
    error.statusCode = 422
    throw error
  }

  const id = req.params.id
  const title = req.body.title
  const content = req.body.content
  let imageUrl = req.body.image

  if(req.file) {
    imageUrl = req.file.path
  }
  if(!imageUrl) {
    const error = new Error('No image found')
    error.statusCode = 422
    throw error
  }

  Post.findById(id).populate('creator')
  .then(post => {
    if(!post) {
      const error = new Error('Could not find post')
      error.statusCode = 404
      throw error
    }

    if(post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized')
      error.statusCode = 403
      throw error
    }

    if(imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl)
    }

    post.title = title
    post.content = content
    post.imageUrl = imageUrl
    return post.save()
  })
  .then(post => {
    io.getIO().emit('posts', {action: 'update', post: post}) //manda uma msg pra todos os users conectados
    res.status(200).json({
      post: {post: post}
    })
  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })
}

exports.deletePost = (req, res, next) => {

  const id = req.params.id

  Post.findById(id)
  .then(post => {
    if(!post) {
      const error = new Error('Could not find post')
      error.statusCode = 404
      throw error
    }

    if(post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized')
      error.statusCode = 403
      throw error
    }

    if(post.imageUrl) {
      clearImage(post.imageUrl)
    }
    return Post.findByIdAndRemove(id)
  })
  .then(post => {
    return User.findById(req.userId)
  })
  .then(user => {
    return user.posts.pull(id)
  })
  .then(result => {
    io.getIO().emit('posts', {action: 'delete', post: id}) //manda uma msg pra todos os users conectados
    res.status(200).json({
      user: result
    })
  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })
}

const clearImage = filepath => {
  filepath = path.join(__dirname, '..', filepath)
  fs.unlink(filepath, err => console.log(err))
}