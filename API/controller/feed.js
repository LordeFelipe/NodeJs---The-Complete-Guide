exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{title: "ola", content: "asds"}]
  })
}

exports.createPost = (req, res, next) => {
  const title = req.body.title
  const content = req.body.content
  res.status(201).json({
    message: 'Post created successfully',
    post: {id: 5, title: title, content: content}
  })
}