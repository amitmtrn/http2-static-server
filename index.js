#!/usr/bin/env nodejs

var nodePromise = require('node-promises'),
    http2 = require('http2'),
    url = require('url'),
    Q = require('q'),
    path = require('path'),
    fs = nodePromise('fs'),
    port = process.argv[2] || 8081;

var options = {
  key: fs.readFileSync(__dirname + '/ssl/server.key.insecure'),
  cert: fs.readFileSync(__dirname + '/ssl/server.crt'),
  ca:  fs.readFileSync(__dirname + '/ssl/server.csr')
};


function app(request, response) {
  var uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), uri);
  console.log(request.method + ' https://localhost:8081' + uri);

  fs.existsPromise(filename)
    .spread(checkFile)
    .then(directoryHandle);

  function directoryHandle(isDirectory) {
    if (isDirectory) {
      fs.existsPromise(filename + '/index.html').spread(directoryViewer);
    } else {
      fs.readFilePromise(filename, "binary").spread(loadFile);
    }

  }

  function directoryViewer(exists) {
    if(exists) {
      fs.readFilePromise(filename + '/index.html', "binary").spread(loadFile);
    } else {
      var files = fs.readdirSync(filename);
      var html = '';
      var showslash = uri + '/';
      for (var i=0; i< files.length; i++){
        if(uri == '/') {showslash = '/';} else {showslash = uri + '/';}
        html += '<div><a href="' + showslash + files[i] + '">' + files[i] + "</a></div>";
      }

      response.writeHead(200);
      response.write(html);
      response.end();
    }
  }

  function checkFile(exists) {
    var deferred = Q.defer();

    if(!exists) {
      deferred.reject(send404());
    } else {
      deferred.resolve(fs.statSync(filename).isDirectory());
    }

    return deferred.promise;
  }
function send404(argument) {
  response.writeHead(404, {"Content-Type": "text/plain"});
  response.write("404 Not Found\n");
  response.end();
  return 'error 404';
}
  function loadFile(err, file) {
    if(err) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(err + "\n");
      response.end();
      return;
    }

    response.writeHead(200);
    response.write(file, "binary");
    response.end();
  }
}

var server = http2.createServer(options, app);
server.listen(parseInt(port, 10));

console.log("Static file server running at\n  => https://localhost:" + port + "/\nCTRL + C to shutdown");
