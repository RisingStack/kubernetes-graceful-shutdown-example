'use strict'

// my dummy db
let isOpen

function connect () {
  isOpen = true
  return Promise.resolve()
}

function close () {
  isOpen = false
  return Promise.resolve()
}

function ping () {
  return isOpen ? Promise.resolve() : Promise.reject()
}

module.exports = {
  connect,
  close,
  ping
}
