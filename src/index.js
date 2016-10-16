'use strict'

const http = require('http')
const promisify = require('es6-promisify')
const enableDestroy = require('server-destroy')
const db = require('./db')
const server = require('./server')
const port = process.env.PORT || 3000
const DEBUG_DELAY = 2000
let READINESS_PROBE_DELAY = 2 * 2 * 1000     		// failureThreshold: 2, periodSeconds: 2 (4s)
READINESS_PROBE_DELAY += DEBUG_DELAY            // just for demonstrate that really doesn't receive requests after 4s

enableDestroy(server)

const serverListen = promisify(server.listen, server)
const serverDestroy = promisify(server.destroy, server)

// craceful start
db.connect()                                      // open db connection first
  .then(() => serverListen(port))                 // listen after succss db connection
  .then(() => {
    console.info(`App is listening on port: ${port}`)
  })
  .catch((err) => {
    console.error(err)
  })

// gcraceful stop
function greacefulStop () {
  console.info('Server is shutting down...', new Date().toISOString())

  serverDestroy()   										            // close server first (ongoing requests)
    .then(() => db.close())  		                  // close db after it's not needed by server / worker task
    .then(() => {
      console.info('Succesfull graceful shutdown', new Date().toISOString())
      process.exit(0)									            // exit with ok code
    })
    .catch((err) => {
      console.error('Error happened during graceful shutdown', err)
      process.exit(1)									            // exit with not ok code
    })
}

// support gracefull shutdown
// do not accept more request
process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())

  // Wait a little bit to give enough time for Kubernetes readiness probe to fail (we don't want more traffic)
  // Don't worry livenessProbe won't kill it until (failureThreshold: 3) => 30s
  // http://www.bite-code.com/2015/07/27/implementing-graceful-shutdown-for-docker-containers-in-go-part-2/
  setTimeout(greacefulStop, READINESS_PROBE_DELAY)
})
