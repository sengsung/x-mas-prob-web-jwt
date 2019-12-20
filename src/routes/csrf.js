const { UserCsrf, BoardCsrf } = require('../sequelize');

const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const CONF = require('../config');
const { wrap, getHash } = require('../func');

router.use(express.static(`${__dirname}/../static/csrf`));

router.use((req, res, next) => {
  const token = req.cookies.token;
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

router.post('/join', wrap(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.send({ code: 400 });

  const u = await UserCsrf.findOne({
    where: { username },
    attributes: ['id'],
  });
  if (u) return res.send({ code: 423 });

  const user = await UserCsrf.create({
    username,
    password: getHash(password)
  });

  res.send({ code: 200, id: await user.get('id') });
}));

router.post('/login', wrap(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.send({ code: 400 });

  const user = await UserCsrf.findOne({
    where: {
      username,
      password: getHash(password)
    },
    attributes: ['id'],
  });
  if (!user) return res.send({ code: 404 });

  const token = jwt.sign(
    {
      uid: user.id,
      isAdmin: false
    },
    CONF.jwt.csrf.key.private,
    CONF.jwt.csrf.options
  );
  res.cookie('token', token, { httpOnly: true });
  res.send({ code: 200 });
}));

router.get('/logout', (req, res) => {
  res.cookie('token', '', { maxAge: Date.now() });
  res.redirect('.');
});

router.get('/me', needAuth, wrap(async (req, res) => {
  const { uid } = req.auth;

  const user = await UserCsrf.findOne({ where: { id: uid }, attributes: ['username'] });
  if (!user) return res.send({ code: 500 });

  res.send({ code: 200, username: user.username });
}));

router.get('/board', needAuth, wrap(async (req, res) => {
  const { uid } = req.auth;

  const boards = await BoardCsrf.findAll({
    where: { uid },
    attributes: ['id', 'title'],
    limit: 10,
    order: [['id', 'DESC']],
  });

  res.send({ code: 200, data: boards });
}));

router.get('/board/:id', needAuth, wrap(async (req, res) => {
  const { id } = req.params;
  const { uid } = req.auth;

  const board = await BoardCsrf.findOne({
    where: {
      id,
      uid
    },
    attributes: ['title', 'content'],
  });
  if (!board) return res.send({ code: 404 });

  if (board.content.includes('<script>') || board.content.includes('<form>')) return res.send({ code: 400 });

  res.send({ code: 200, data: board });
}));

router.post('/board', needAuth, wrap(async (req, res) => {
  const { uid } = req.auth;
  const { title, content } = req.body;

  if (!title || !content) return res.send({ code: 400 });

  const board = await BoardCsrf.create({
    uid,
    title,
    content,
  });

  res.send({ code: 200, id: await board.get('id') });
}));

function needAuth(req, res, next) {
  if (!req.auth) return res.send({ code: 401 });
  next();
}

module.exports = router;
