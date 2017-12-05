'use strict'

const promisify = require('es6-promisify')
const stoppable = require('stoppable')
const db = require('./db')
const server = require('./server')
const port = process.env.PORT || 3000
const DEBUG_DELAY = 2000                          // just for demonstrate that it really doesn't receive requests after 4s
const READINESS_PROBE_DELAY = 2 * 2 * 1000     		// failureThreshold: 2, periodSeconds: 2 (4s)

// Keep-alive connections doesn't let the server to close in time
// Destory extension helps to force close connections
// Because we wait READINESS_PROBE_DELAY, we expect that all requests are fulfilled
// https://en.wikipedia.org/wiki/HTTP_persistent_connection
stoppable(server)

const serverListen = promisify(server.listen, server)
const serverDestroy = promisify(server.destroy, server)

// graceful start
db.connect()                                      // open DB connection first
  .then(() => serverListen(port))                 // listen after succss db connection
  .then(() => {
    console.info(`App is listening on port: ${port}`)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

// Graceful stop
function gracefulStop () {
  console.info('Server is shutting down...', new Date().toISOString())

  serverDestroy()   										          // close server first (ongoing requests)
    .then(() => db.close())  		                  // close DB after it's not needed by server / worker task
    .then(() => {
      console.info('Successful graceful shutdown', new Date().toISOString())
      process.exit(0)									            // exit with ok code
    })
    .catch((err) => {
      console.error('Error happened during graceful shutdown', err)
      process.exit(1)									            // exit with not ok code
    })
}

// Support graceful shutdown
// do not accept more request and release resources
process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())

  // Wait a little bit to give enough time for Kubernetes readiness probe to fail (we don't want more traffic)
  // Don't worry livenessProbe won't kill it until (failureThreshold: 3) => 30s
  // http://www.bite-code.com/2015/07/27/implementing-graceful-shutdown-for-docker-containers-in-go-part-2/
  setTimeout(gracefulStop, READINESS_PROBE_DELAY + DEBUG_DELAY)
})
