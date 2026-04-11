const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.2',
  ciphers: 'TLS_RSA_WITH_AES_128_CBC_SHA256:TLS_RSA_WITH_AES_256_CBC_SHA256:TLS_RSA_WITH_AES_128_CBC_SHA:TLS_RSA_WITH_AES_256_CBC_SHA:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA'
};

const server = https.createServer(options, (req, res) => {
  if (req.method === 'GET' && req.url === '/hello') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Anna Usata kp_32');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('Server running at https://localhost:3000');
});