'use strict';
require('pmx').init({
                        http:          false, // HTTP routes logging (default: true)
                        errors:        false, // Exceptions loggin (default: true)
                        custom_probes: true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
                        network:       false, // Network monitoring at the application level
                        ports:         false // Shows which ports your app is listening on (default: false)
                    });
var http2        = require('http2'),
    onHeaders    = require('on-headers'),
    fs           = require('fs'),
    tls          = require('tls'),
    url          = require('url'),
    Redis        = require('ioredis'),
    //    naffinity     = require('nodeaffinity'),
    redisCluster = [
        {port: 6379, host: "127.0.0.1"},
        {port: 6378, host: "127.0.0.1"},
        {port: 6377, host: "127.0.0.1"},
        {port: 6376, host: "127.0.0.1"},
        {port: 6375, host: "127.0.0.1"},
        {port: 6374, host: "127.0.0.1"}
    ],
    os           = require('os'),
    hostname     = os.hostname(),
    netIf        = os.networkInterfaces().eth1[0].address,
    pid          = process.pid,
    redisReady   = false,
    rmOK         = 'OK',
    rmERROR      = 'ERR',
    raSET         = 'SET',
    raGET         = 'GET',
    raTRANSACTION = 'TRN',
    raPIPELINE    = 'PPL',
    hdREDIS       = 'X-Redis-Time',
    hdNODE        = 'X-Node-Time';
//
// Set affinity to CPUs 0,1,2
//
//naffinity.setAffinity(7);
//
// Defines certificates for enabling TLSv1.2
//
var sslCerts = {
    key:  fs.readFileSync('./nginx-selfsigned.key'),
    cert: fs.readFileSync('./nginx-selfsigned.crt')
};
//
// Create redis cluster client
//
var cluster = new Redis.Cluster(
    redisCluster,
    {
        enableReadyCheck:        true,
        maxRedirections:         6,
        retryDelayOnFailover:    1000,
        retryDelayOnClusterDown: 1000,
        scaleReads:              'all',
        redisOptions:            {
            connectionName:         'H' + hostname + 'P' + pid,
            parser:                 'hiredis',
            dropBufferSupport:      true,
            prefix:                 'cn:',
            showFriendlyErrorStack: true
        }
    }
);
//
// Set redis events listeners
//
cluster.on("ready", function() {
    redisReady = true;
    console.log("redis.io cluster connection opened and ready to serve");
});
cluster.on("end", function() {
    redisReady = false;
    console.log("redis.io cluster connection closed");
});
cluster.on("error", function(err) {
    console.log("redis.io Error: " + err);
});
cluster.on("node error", function(err) {
    console.log("redis.io Node Error: " + err);
});
//
// Create diff hrtime header
//
var createDiffHrtimeHeader = function(headerLabel, startHRTime, httpResponse) {
    var diffR = process.hrtime(startHRTime),
        timeR = diffR[0] * 1e3 + diffR[1] * 1e-6;
    httpResponse.setHeader(headerLabel, timeR.toFixed(3));
};
//
// Message handlers
//
var messageHandler = function(jsonMsg, httpResponse, redisAction, redisValue) {
    jsonMsg.redisAction = redisAction;
    jsonMsg.redisObject = redisValue;
    httpResponse.end(JSON.stringify(jsonMsg));
};
//
// Send default ERR response due to a Redis error
//
var sendRedisError = function(jsonMsg, redisError, httpResponse, startHRTime) {
    createDiffHrtimeHeader(hdREDIS, startHRTime, httpResponse);
    messageHandler(jsonMsg, httpResponse, rmERROR, {});
    console.log(redisError);
};
//
// Send composite message based on Redis results
//
var sendRedisResults = function(jsonMsg, httpResponse, redisAction, redisValue, startHRTime) {
    createDiffHrtimeHeader(hdREDIS, startHRTime, httpResponse);
    messageHandler(jsonMsg, httpResponse, redisAction, redisValue);
};
//
// Encapsulates HMSET call
//
var redisSetCall = function(jsonMsg, httpResponse, param) {
    var redisValue     = {hostname: hostname, pid: pid, ts: Date.now()},
        startRedisCall = process.hrtime(),
        promise        = cluster.hmset(param, redisValue);
    promise.then(function(redisMessage) {
        sendRedisResults(jsonMsg, httpResponse, (redisMessage === rmOK) ? raSET : rmERROR, {}, startRedisCall);
    }, function(redisError) {
        sendRedisError(jsonMsg, redisError, httpResponse, startRedisCall);
    });
};
//
// Encapsulates HGETALL call
//
var redisGetCall = function(jsonMsg, httpResponse, param) {
    var startRedisCall = process.hrtime(),
        promise        = cluster.hgetall(param);
    promise.then(function(redisMessage) {
        sendRedisResults(jsonMsg, httpResponse, raGET, (redisMessage === '') ? {} : redisMessage, startRedisCall);
    }, function(redisError) {
        sendRedisError(jsonMsg, redisError, httpResponse, startRedisCall);
    });
};
//
// Encapsulates PIPELINE call
//
var redisPipelineCall = function(jM, hR, param) {
    var redisValue     = {hostname: hostname, pid: pid, ts: Date.now()},
        startRedisCall = process.hrtime(),
        promise        = cluster.pipeline().hgetall(param).hmset(param, redisValue).exec();
    promise.then(function(rM) {
        sendRedisResults(jM, hR, raPIPELINE, (rM.length === 0) ? {} : rM[0][1], startRedisCall);
    }, function(rE) {
        sendRedisError(jM, rE, hR, startRedisCall);
    });
};
//
// Encapsulates TRANSACTION call
//
var redisTransactionCall = function(jM, hR, param) {
    var redisValue     = {hostname: hostname, pid: pid, ts: Date.now()},
        startRedisCall = process.hrtime(),
        promise        = cluster.multi().hgetall(param).hmset(param, redisValue).exec();
    promise.then(function(rM) {
        sendRedisResults(jM, hR, raTRANSACTION, (rM.length === 0) ? {} : rM[0][1], startRedisCall);
    }, function(rE) {
        sendRedisError(jM, rE, hR, startRedisCall);
    });
};
//
// Prepare execution function stack
//
var executionMatrix = [redisGetCall,
                       redisSetCall,
                       redisPipelineCall,
                       redisTransactionCall];
//
// Main HTTP/2 server handler
//
var setAllHeaders = function(hRq, hR) {
    // hR.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    // hR.setHeader('Pragma', 'no-cache');
    // hR.setHeader('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT');
    hR.setHeader("Access-Control-Allow-Origin", "*");
    hR.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Pragma, Cache-Control, If-Modified-Since, X-ReqId");
    hR.setHeader("Content-Type", "application/json");
    //hR.setHeader("X-ReqId", hRq.headers['x-reqid'] || "-1");
};
var server = http2.createServer(sslCerts, function(hRq, hR) {
    var startNodeCall = process.hrtime(),
        jM            = {
            hostname: hostname,
            pid:      pid
        },
        params        = url.parse(hRq.url, true).query,
        o             = params.o || 0,
        p             = params.p || 0;
    onHeaders(hR, function onHeaders () {
        createDiffHrtimeHeader(hdNODE, startNodeCall, hR);
    });
    setAllHeaders(hRq, hR);
    if (redisReady) {
        executionMatrix[o](jM, hR, p);
    }
    else {
        hR.setHeader(hdREDIS, 0);
        messageHandler(jM, hR, rmERROR, {});
    }
}).listen(process.env.NODEPORT, netIf);
//
// Enables graceful stop/reload - nicely closes connections to redis and closes HTTP/2 server
// enabling last transactions, both on redis and HTTP/2 server to be completed before exiting
//
process.on('SIGINT', function() {
    //
    // finishes all redis transactions and closes connection with redis
    //
    cluster.quit();
    //
    // finishes all HTTP/2 responses and close server
    //
    server.close();
    //
    // nicely exit node after 0.3 seconds
    //
    setTimeout(function() { process.exit(0); }, 300);
});
