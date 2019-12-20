const CONF = require('./config');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

const bruthapp = require('./routes/bruth');
const csrfapp = require('./routes/csrf');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('common'));
app.use(helmet());
app.use(cors());

app.use('/bruth', bruthapp);
app.use('/csrf', csrfapp);

app.use((err, _req, res, _next) => {
  console.log(err);
  res.send({ code: 500 });
});

app.use((_req, res, _next) => {
  res.send({ code: 404 });
});

app.listen(CONF.http.port, () => {
  console.log(`http server start on ${CONF.http.port}`);
});
