#!/usr/bin/env node

var express = require('express');
var fs = require('fs');
var http2 = require('http2');
var directory = require('serve-index');
var app = express();

app.use(directory('./'));
app.use(express.static('./'));

var options = {
  key: fs.readFileSync(__dirname + '/ssl/server.key.insecure'),
  cert: fs.readFileSync(__dirname + '/ssl/server.crt'),
  ca:  fs.readFileSync(__dirname + '/ssl/server.csr')
};

var server = http2.createServer(options, app);

server.listen(8081);
