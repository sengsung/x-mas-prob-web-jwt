const fs = require('fs');

module.exports = {
  http: {
    port: 80,
    flagPort: 81,
  },
  https: {
    use: false,
    port: 443,
    key: './src/ssl/private.key',
    cert: './src/ssl/certificate.crt',
  },
  db: {
    host: '127.0.0.1',
    port: '3306',
    database: 'xmasctf',
    user: 'root',
    password: 'sengsung',
  },
  jwt: {
    bruth: {
      key: 'merryxmas',
      options: {
        issuer: 'Fishsoup',
        expiresIn: '1d',
        algorithm: 'HS256',
      }
    },
    csrf: {
      key: {
        private: fs.readFileSync('./src/keys/private.key'),
        public: fs.readFileSync('./src/keys/public.key'),
      },
      options: {
        issuer: 'Fishsoup',
        expiresIn: '1h',
        algorithm: 'RS256',
      },
    },
  },
  flag: {
    bruth: 'bruth flag',
    csrf: 'csrf flag',
  },
  hashSort: 'fmni4q3uigt35iluhw4ggliu325hg354@%@#',
  password: 'test',
}
