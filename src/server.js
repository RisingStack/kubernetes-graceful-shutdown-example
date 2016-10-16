'use strict'

const http = require('http')
const health = require('./health')
let wasSigterm

process.on('SIGTERM', function onSigterm () {
  wasSigterm = true
})

// my dummy server
const server = http.createServer((req, res) => {
  if (wasSigterm) {
    console.log(`Request after sigterm: ${req.url}`, new Date().toISOString())
  }

  // GET /health
  if (req.method === 'GET' && req.url.match(/\/health/)) {
    return health.get(req, res)
  }

  res.writeHead(200)
  res.end('foo')
})

module.exports = server
