const express = require('express')
const app = express()
const server = require('http').createServer(app)
const path = require('path')
app.use(
  express.static( path.join(__dirname, '/static') )
)
const port = process.env.PORT || 80
server.listen(port, ()=> {
  console.log('listening on: ', port)
})