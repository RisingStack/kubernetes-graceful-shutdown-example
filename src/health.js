'use strict'

const db = require('./db')
const promiseTimeout = require('./promiseTimeout')
const state = { isShutdown: false }
const TIMEOUT_IN_MILLIS = 900

process.on('SIGTERM', function onSigterm () {
  state.isShutdown = true
})

function get (req, res) {
  // SIGTERM already happened
  // app is not ready to server more requests
  if (state.isShutdown) {
    console.info('HEALTH: NOT OK')
    res.writeHead(500)
    return res.end('not ok')
  }

  // something cheap but tests the required resources
  // timeout because we would like to log before livenessProbe KILLS the process
  promiseTimeout(db.ping(), TIMEOUT_IN_MILLIS)
    .then(() => {
      console.info('HEALTH: OK')
      // success health
      res.writeHead(200)
      return res.end('ok')
    })
    .catch(() => {
      // broken health
      res.writeHead(500)
      return res.end('not ok')
    })
}

module.exports = {
  get: get,
  _state: state       // only for testing
}
