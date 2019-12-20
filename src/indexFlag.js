const CONF = require('./config');
const { wrap } = require('./func');

const jwt = require('jsonwebtoken');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

const request = require('request-promise');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('common'));
app.use(helmet());
app.use(cors());

app.get('/logout', (req, res) => {
  res.cookie('token_flag', '', { maxAge: Date.now() });
  res.redirect('.');
});

app.use((req, res, next) => {
  const token = req.cookies.token_flag;

  if (token) {
    jwt.verify(token, CONF.jwt.csrf.key.public, CONF.jwt.csrf.options, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.send({ code: 401, msg: '토큰이 만료되었습니다' });
        } else if (err.name === 'JsonWebTokenError') {
          return res.send({ code: 401, msg: '토큰에 에러가 있습니다' });
        } else {
          return res.send({ code: 401, msg: "토큰 인증 절차에 오류가 발생했습니다", err: err.message });
        }
      } else {
        req.auth = decoded;
        next();
      }
    });
  } else {
    next();
  }
});

app.get('/auth', (req, res) => {
  const { password } = req.query;

  if (password !== CONF.password) return res.send({ code: 403 });

  const token = jwt.sign(
    { isAdmin: true },
    CONF.jwt.csrf.key.private,
    CONF.jwt.csrf.options
  );
  res.cookie('token_flag', token, { httpOnly: true });
  res.send({ code: 200, token });
});

app.post('/flag', needAuth, wrap(async (req, res) => {
  if (!req.auth.isAdmin) return res.send({ code: 403 });

  const url = req.query.redirect_uri;
  if (!url) return res.send({ code: 400 });

  await request({
    method: 'get',
    url: `${url}?flag=${CONF.flag.csrf}`,
  });
  res.send({ code: 200 });
}));

app.use((err, _req, res, _next) => {
  console.log(err);
  res.send({ code: 500 });
});

app.use((_req, res, _next) => {
  res.send({ code: 404 });
});

app.listen(CONF.http.flagPort, () => {
  console.log(`http server start on ${CONF.http.flagPort}`);
});

function needAuth(req, res, next) {
  if (!req.auth) return res.send({ code: 401 });
  next();
}
