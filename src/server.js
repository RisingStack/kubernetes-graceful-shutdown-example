'use strict'

const http = require('http')
const health = require('./health')

// my dummy server
const server = http.createServer((req, res) => {
  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    return health.get(req, res)
  }

  res.writeHead(200)
  res.end('foo')
})

module.exports = server
