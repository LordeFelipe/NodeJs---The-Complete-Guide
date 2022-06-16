const path = require('path')
const fs = require('fs')

const express = require("express")
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const {graphqlHTTP} = require('express-graphql')

const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/auth')

const MONGODB_URI =
  'mongodb+srv://lordefelipe:100499@cluster0.fp2oy.mongodb.net/mySecondDatabase?retryWrites=true&w=majority';
  
const app = express()


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    cb(null, true)
  }
  else{
    cb(null, false)
  }
}

app.use(bodyParser.json())
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', '*') //Content-Type, Authorization
  next();
})

app.put('post-image', (req, res, next) => {
  if(!req.isAuth) {
    throw new Error('Not Authenticated')
  }
  if(!req.file) {
    return res.status(200).json({message: 'No file provided'})
  }
  if(req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  return res.status(201).json({message: 'File Stored', filePath: req.file.path})

})

app.use(auth)

app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  formatError(err) {
    if(!err.originalError) {
      return err;
    }
    const data = err.originalError.data
    const message = err.message || 'An error ocurred'
    const code = err.originalError.code || 500
    return { message: message, status: code, data: data }
  }
}))

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({message: err.message})
})

mongoose.connect(MONGODB_URI)
  .then(result => {
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });

  const clearImage = filepath => {
    filepath = path.join(__dirname, '..', filepath)
    fs.unlink(filepath, err => console.log(err))
  }