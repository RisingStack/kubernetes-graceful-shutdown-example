'use strict'

// my dummy db

function connect () {
  return Promise.resolve()
}

function close () {
  return Promise.resolve()
}

function ping () {
  return Promise.resolve()
}

module.exports = {
  connect,
  close,
  ping
}
