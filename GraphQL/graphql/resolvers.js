const User = require('../models/user')
const Post = require('../models/post')

const bcrypt = require('bcryptjs')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const { __validationErrors } = require('./schema')

module.exports = {
  createUser: async function ({userInput}, req) {
    const errors = []
    if(!validator.isEmail(userInput.email)) {
      errors.push({message: 'E-mail is invalid'})
    }

    if(validator.isEmpty(userInput.password) || validator.isLength(userInput.password, {min: 5})) {
      errors.push({message: 'Password is invalid'})
    }

    if(errors.length > 0) {
      const error = new Error("Invalid Input")
      error.data = errors
      error.code = 422 
      throw error
    }

    const existingUser = await User.findOne({email: userInput.email})
    if (existingUser) {
      const error = new Error("User already exists")
      throw error
    }
    
    hashedPassword = await bcrypt.hash(userInput.password,12)

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword
    })

    const storedUser = await user.save()

    return {...storedUser._doc, _id: storedUser._id.toString()}

  },

  login: async function ({email, password}, req) {

    const user = await User.findOne({email: email})

    if(!user){
      const error = new Error('User not found')
      error.code = 404
      throw error
    }

    const isEqual = await bcrypt.compare(password, user.password)

    if(!isEqual){
      const error = new Error('Wrong Password')
      error.code = 401
      throw error
    }

    const token = jwt.sign({
      email: user.email, 
      userId: user._id.toString()
    }, 'secret', {expiresIn: '1h'}) //Secret é o codigo para criptografar

    return {token: token, userId: user._id.toString()}

  },

  posts: async function ({page}, req)  {
    if(!req.isAuth) {
      const error = new Error ('Not authenticated')
      error.code = 401
      throw error
    }

    const currentPage = page || 1
    const perPage = 2

    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find().populate('creator').sort({createdAt: -1}).skip((currentPage - 1)*perPage).limit(perPage)

    return({posts: posts.map(post => {return{...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString()}}), totalPosts: totalItems})

  },

  post: async function ({id}, req)  {

    const post = await Post.findById(id).populate('creator')
    if(!post) {
      const error = new Error('Could not find post')
      error.code = 404
      throw error
    }
    return({...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString()})
  },

  createPost: async function ({postInput}, req) {

    if(!req.isAuth) {
      const error = new Error ('Not authenticated')
      error.code = 401
      throw error
    }

    const errors = []
    if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
      errors.push({message: 'Title is invalid'})
    }

    if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
      errors.push({message: 'Content is invalid'})
    }

    if(errors.length > 0) {
      const error = new Error("Invalid Input")
      error.data = errors
      error.code = 422 
      throw error
    }

    const user = User.findById(req.userId)

    if (!user) {
      const error = new Error("Invalid User")
      error.code = 401 
      throw error
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    })

    const createdPost = await post.save()

    user.posts.push(createdPost)

    await user.save()

    return {...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString(), updatedAt: createdPost.updatedAt.toISOString()}

  },

  updatePost: async function ({id, postInput}, req) {

    if(!req.isAuth) {
      const error = new Error ('Not authenticated')
      error.code = 401
      throw error
    }

    const errors = []
    if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
      errors.push({message: 'Title is invalid'})
    }

    if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
      errors.push({message: 'Content is invalid'})
    }

    if(errors.length > 0) {
      const error = new Error("Invalid Input")
      error.data = errors
      error.code = 422 
      throw error
    }

    const user = User.findById(req.userId)

    if (!user) {
      const error = new Error("Invalid User")
      error.code = 401 
      throw error
    }

    const post = await Post.findById(id).populate('creator')

    if(!post) {
      const error = new Error('Could not find post')
      error.code = 404
      throw error
    }

    if(post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized')
      error.code = 403
      throw error
    }

    post.title = postInput.title
    post.content = postInput.content

    if(postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl
    }

    const updatedPost = await post.save()

    return {...updatedPost._doc, _id: updatedPost._id.toString(), createdAt: updatedPost.createdAt.toISOString(), updatedAt: updatedPost.updatedAt.toISOString()}

  },

  deletePost: async function ({id, postInput}, req) {
    if(!req.isAuth) {
      const error = new Error ('Not authenticated')
      error.code = 401
      throw error
    }

    const post = await Post.findById(id)

    if(!post) {
      const error = new Error('Could not find post')
      error.code = 404
      throw error
    }

    if(post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized')
      error.code = 403
      throw error
    }

    clearImage(post.imageUrl)
    await Post.findByIdAndRemove(id)

    const user = await User.findById(req.userId)
    user.posts.pull(id)
    await user.save()

    return true

  },

  user: async function(args, req) {
    if(!req.isAuth) {
      const error = new Error ('Not authenticated')
      error.code = 401
      throw error
    }
    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error("Invalid User")
      error.code = 401 
      throw error
    }
    return {...user._doc, _id: user._id.toString()}
  },

  updateStatus: async function({status}, req) {
    if(!req.isAuth) {
      const error = new Error ('Not authenticated')
      error.code = 401
      throw error
    }
    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error("Invalid User")
      error.code = 401 
      throw error
    }

    user.status = status
    await user.save()
    return {...user._doc, _id: user._id.toString()}
  }
}

const clearImage = filepath => {
  filepath = path.join(__dirname, '..', filepath)
  fs.unlink(filepath, err => console.log(err))
}