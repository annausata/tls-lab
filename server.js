const https = require('https');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

const CLIENT_ID = 'b71f623f1c7efa723c3f';
const CLIENT_SECRET = '135836cd9abf3a7bc2b4cc1170821f20b9457557';
const CASDOOR_URL = 'http://localhost:8000';
const REDIRECT_URI = 'https://localhost:3000/callback';

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
  res.redirect('/');
});

app.get('/user-info', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userRes = await fetch(`${CASDOOR_URL}/api/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const userData = await userRes.json();
  if (!userRes.ok || userData.status === 'error') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json(userData);
});

const options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.2',
  ciphers: 'AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA'
};

https.createServer(options, app).listen(3000, () => {
  console.log('Server running at https://localhost:3000');
});