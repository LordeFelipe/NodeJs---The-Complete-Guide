const fs = require('fs')
const path = require('path')

const {validationResult} = require('express-validator/check')

const Post = require('../models/post')
const User = require('../models/user')

exports.getPosts = (req, res, next) => {
  
  const currentPage = req.query.page || 1
  const perPage = 2
  let totalItems
  
  Post.find().countDocuments()
  .then(count => {
    totalItems = count
    return Post.find().skip((currentPage - 1)*perPage).limit(perPage)
  })
  .then(posts => {
    res.status(200).json({
      posts: posts, totalItems: totalItems
    })
  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })  
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

exports.createPost = (req, res, next) => {
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
  let creator

  const post = new Post({
    title: title, 
    content: content, 
    imageUrl: imageUrl,
    creator: req.userId, 
  })

  post.save()
  .then(res => {
    return User.findById(req.userId)
  })
  .then(user => {
    creator = user
    user.posts.push(post)
    return user.save()
  })
  .then(result => {
    res.status(201).json({
      message: 'Post created successfully',
      post: post,
      creator: {_id: creator._id, name: creator.name}
    })
  })
  .catch(e => {
    if(!e.statusCode) {
      e.statusCode = 500
    }
    next(e)
  })

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

    if(imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl)
    }

    post.title = title
    post.content = content
    post.imageUrl = imageUrl
    return post.save()
  })
  .then(post => {
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