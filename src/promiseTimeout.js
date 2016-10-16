'use strict'

function promiseTimeout (originalPromise, timeout) {
  if (!originalPromise) {
    throw new TypeError('originalPromise is required')
  }

  if (!Number.isInteger(timeout)) {
    throw new TypeError('timeout is required to be a number')
  }

  return Promise.race([
    // MDN: Generally, if you want to know if a value is a promise or not - Promise.resolve(value) it instead and work with the return value as a promise.
    Promise.resolve(originalPromise),
    new Promise((resolve, reject) => {
      setTimeout(function onTimeout () {
        reject(new Error('Timed out'))
      }, timeout)
    })
  ])
}

module.exports = promiseTimeout
