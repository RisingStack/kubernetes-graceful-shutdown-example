# kubernetes-graceful-shutdown-example

Example repository to give a help with Kubernetes graceful start and shutdown in Node.js

## What it does?

1. pod receives *SIGTERM* signal because Kubernetes wants to stop the it because of deploy, scale etc.
2. App *(pod)* starts to return `500` for `GET /health` to let `readinessProbe` *(Service)* know that it's not ready to receive more requests.
3. Kubernetes `readinessProbe` checks `GET /health` and after *(failureThreshold * periodSecond)* it stops redirecting traffic after to the app *(because it continuously returns 500)*
4. App waits *(failureThreshold * periodSecond)* before starts shutdown, to being sure that Service is get notified via `readinessProbe` fail
5. App starts graceful shutdown
6. App first close server with live working DB connections
7. App closes databases after the server is closed
8. App exists process
9. Kubernetes force kill application after 30s *(SIGKILL)* if it's still running *(in an optimal case it doesn't happen)*

In our case Kubernetes `livenessProbe` won't kill the app before graceful shutdown because needs to wait *(failureThreshold * periodSecond)* to do it, so `livenessProve` threshold should be larger than `readinessProbe` threshold *(graceful stop happens around 4s, force kill would happen 30s after SIGTERM)*

## Benchmark

### Test case

```
$ ab -n 100000 -c 20
```

Plus changing an environment variable in the `Deployment` to re-deploy all pods during the `ab` benchmarking.

### AB output

```
Document Path:          /
Document Length:        3 bytes

Concurrency Level:      20
Time taken for tests:   172.476 seconds
Complete requests:      100000
Failed requests:        0
Total transferred:      7800000 bytes
HTML transferred:       300000 bytes
Requests per second:    579.79 [#/sec] (mean)
Time per request:       34.495 [ms] (mean)
Time per request:       1.725 [ms] (mean, across all concurrent requests)
Transfer rate:          44.16 [Kbytes/sec] received
```

### Application log output

```
Got SIGTERM. Graceful shutdown start 2016-10-16T18:54:59.208Z
Request after sigterm: / 2016-10-16T18:54:59.217Z
Request after sigterm: / 2016-10-16T18:54:59.261Z
...
Request after sigterm: / 2016-10-16T18:55:00.064Z
Request after sigterm: /health?type=readiness 2016-10-16T18:55:00.820Z
HEALTH: NOT OK
Request after sigterm: /health?type=readiness 2016-10-16T18:55:02.784Z
HEALTH: NOT OK
Request after sigterm: /health?type=liveness 2016-10-16T18:55:04.781Z
HEALTH: NOT OK
Request after sigterm: /health?type=readiness 2016-10-16T18:55:04.800Z
HEALTH: NOT OK
Server is shutting down... 2016-10-16T18:55:05.210Z
Successful graceful shutdown 2016-10-16T18:55:05.212Z
```

### Benchmark result

**Success!**

Zero failed requests: you can see in the app log that Service stopped sending traffic to the pod.

## Known issues

### keep-alive

Kubernetes doesn't handover keep-alive connections.
Request from agents with keep-alive header will be still routed to the pod.
It's tricked me first when I benchmarked with [autocannon](https://github.com/mcollina/autocannon) or `Google Chrome`.

### Docker signaling

`CMD ["node", "src"]` works, `CMD ["npm", "start"]` not.
It doesn't pass the `SIGTERM` to the node process.

An alternative can be:
https://github.com/Yelp/dumb-init
