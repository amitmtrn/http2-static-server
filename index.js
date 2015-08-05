#!/usr/bin/env node

var nodePromise = require('node-promises'),
    http2 = require('http2'),
    url = require('url'),
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

  fs.existsPromise(filename)
  .spread(checkFile);

  function checkFile(exists) {
    if(!exists) {
      return send404();
    }

    if (fs.statSync(filename).isDirectory()) {
      fs.existsPromise(filename + '/index.html').spread( function(exists){
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
      });
    } else {
      fs.readFilePromise(filename, "binary").spread(loadFile);
    }
  }
function send404(argument) {
  response.writeHead(404, {"Content-Type": "text/plain"});
  response.write("404 Not Found\n");
  response.end();
  return;
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
