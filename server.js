const https = require('https');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { WebSocketServer, WebSocket } = require('ws');
const protobuf = require('protobufjs');

const app = express();

const CLIENT_ID = 'b71f623f1c7efa723c3f';
const CLIENT_SECRET = '135836cd9abf3a7bc2b4cc1170821f20b9457557';
const CASDOOR_URL = 'http://localhost:8000';
const REDIRECT_URI = 'https://localhost:3000/callback';

const CASDOOR_PUBLIC_KEY = `-----BEGIN CERTIFICATE-----
MIIE3TCCAsWgAwIBAgIDAeJAMA0GCSqGSIb3DQEBCwUAMCgxDjAMBgNVBAoTBWFk
bWluMRYwFAYDVQQDEw1jZXJ0LWJ1aWx0LWluMB4XDTI2MDQyNjEzMzYxNVoXDTQ2
MDQyNjEzMzYxNVowKDEOMAwGA1UEChMFYWRtaW4xFjAUBgNVBAMTDWNlcnQtYnVp
bHQtaW4wggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCyLT9crzhqOuQx
Fw+sDg7U3r8zN31zqiqVZcz4+K4aqTuxaVRiDQL9JJtjj+z9WcLf8hje2w3K0BJD
wEEAWevir9QKCxdpKfnba1S7DZ99SonsqR2+7uzHT9/oBhej4NQAkggmV6eRmt7x
uTW833ptEj7/uaGT8+2xak7CakPc8X7NtBnfxTJjEDM715ubzA0Q0lFP0YaHNKIc
o+cwG3W9idim6WGjTa9B/ybpkkhdW9sgmHLZVqgMNfW6neTLIfhpU0P+qiEG4zub
qemmxItTCAZu+tZlcqFL7rMLo+GcaeoeRThtFpBj9fQSGz4JzyAxqkMw0bVIypGi
pCWgzdf29yj5jVvKbf16dt4RTTZgwdBVcsZAh0fvGkWNYIsoRFZeNV+W6SaUxOJg
PzIFZvDLgaP0h7YsN2P+ERXt6KxqdJlxS30Cft7gWUuMCkgeFSeEvzLAFvq0+bdP
33doGHOugMq7Sgc88mf0Md0mMzjC2eTAdKP48I6b3AfATehMSAivu/3ylieG/qhJ
jrMjuJ67mmxwCZBe5QnRr32L5yFblf461G+uJIGidFXAZ0Zue46/5aTf/K6+qaYY
SpNoUOqyKK2Zbx/DsIPBTU1PogWz5uh6nD9UyZ3Pbm2/dPXQZYlHIf5721zE1HEd
pkcjnXE5/sb4Xyza2LU5VtlvUfDFTQIDAQABoxAwDjAMBgNVHRMBAf8EAjAAMA0G
CSqGSIb3DQEBCwUAA4ICAQCqaa8oyYwMbfxBqnb1NScmPW3xNkm1dGveO9GfC5hZ
4F5dvw/tfsq9/D8gYRIrin7igNtz2+P/2DmTaE4EsMD0w9y1SPFdq5GSCqNUbgYm
pHQ2LF0e6d5EXv5ptPeh+O1PgPMkO6nqs5uR4cVXFPKiYbTHdaM51+sbJxn1Ihrm
uonaQtVc9psak5TMk8/HIQ8QR9plhK8AVIxgvs3sUugBvP6mCRjNjkYOdKasqIaK
/WpouL689UGmbz2SVgVFreSVw1EcDxvsaantpazYmRq1Tpvf8UYT0N8ba+j2YKZ7
wi+/5nVVZZASbadpXToslmNU9NXRGc3eMmtwzs7By0zW2cMUg66GxYQdQ8youO20
0ZeMk6UX3kACKKnZGNq0Fuw5EKwX6XeNlX/0lbnRJSNRDqNECQG3rKZSWxZzvIp
9Vs6IoockUQzdutiVJAUeIAofS10H+6Ea60NVmP8o5n0k+OYMcRo+CbOFuzcrRVb
jrUZ6F2xxY64itn/KAtFrrg9D2PNSCbgA8RYczkL3eD5Iq2A1ZTMxZQ1QEvHdyqA
2NPBeRx+MAce0ggWB2C88uW2M3LxJvjHZg47FsG/lqwHDX3omDj2DTKY3x+abXGk
6Ht8lJyj49zunFpmGTDxCXbgyOA9+jOD6JPC6nh5MMPBl8h8XZXT4Q/aIoXaZBBn
DSg==
-----END CERTIFICATE-----`;

const COINS = ['btcusdt', 'ethusdt', 'solusdt', 'xrpusdt', 'dogeusdt'];

app.use(cookieParser());
app.use(session({ secret: 'tls-lab-secret', resave: false, saveUninitialized: false }));
app.use(express.static('public'));

app.get('/hello', (req, res) => {
  res.type('text/plain').send('Hello from Anna Usata kp_32');
});

app.get('/login', (req, res) => {
  const url = `${CASDOOR_URL}/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=openid profile email` +
    `&state=random_state`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code');
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
  });
  const tokenRes = await fetch(`${CASDOOR_URL}/api/login/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
res.cookie('token_js', token, { httpOnly: false, secure: true, sameSite: 'Strict' });
  res.redirect('/');
});

app.get('/user-info', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, CASDOOR_PUBLIC_KEY, { algorithms: ['RS256'] });
    res.json({
      sub: decoded.sub,
      iss: decoded.iss,
      aud: decoded.aud,
      preferred_username: decoded.name,
      name: decoded.name,
      email: decoded.email,
      email_verified: decoded.emailVerified,
      picture: decoded.avatar,
    });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

const options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.2',
  ciphers: 'AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA'
};

const server = https.createServer(options, app);

const wss = new WebSocketServer({ server, path: '/ws' });

let PriceUpdate;
protobuf.load('price.proto').then(root => {
  PriceUpdate = root.lookupType('PriceUpdate');
});

const sessions = new Map();

const binanceWs = new WebSocket(
  `wss://stream.binance.com:9443/stream?streams=${COINS.map(c => `${c}@ticker`).join('/')}`
);

binanceWs.on('message', (data) => {
  if (!PriceUpdate) return;
  const parsed = JSON.parse(data);
  const ticker = parsed.data;
  if (!ticker) return;

  const symbol = ticker.s;
  const price = ticker.c;
  const time = Date.now();

  const msg = PriceUpdate.create({ symbol, price, time });
  const encoded = PriceUpdate.encode(msg).finish();

  for (const [ws, info] of sessions.entries()) {
    if (ws.readyState !== WebSocket.OPEN) continue;
    if (info.coins.includes(symbol.toLowerCase())) {
      ws.send(encoded);
    }
  }
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'https://localhost:3000');
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  try {
    jwt.verify(token, CASDOOR_PUBLIC_KEY, { algorithms: ['RS256'] });
  } catch {
    ws.close(4001, 'Unauthorized');
    return;
  }

  sessions.set(ws, { coins: [] });
  ws.send(JSON.stringify({ type: 'connected', message: 'Вкажи монети для підписки' }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'subscribe' && Array.isArray(data.coins)) {
        sessions.get(ws).coins = data.coins.map(c => c.toLowerCase());
        ws.send(JSON.stringify({ type: 'subscribed', coins: data.coins }));
      }
    } catch {}
  });

  ws.on('close', () => sessions.delete(ws));
});

server.listen(3000, () => {
  console.log('Server running at https://localhost:3000');
});