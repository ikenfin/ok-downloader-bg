const jwt = require('jsonwebtoken');

module.exports = (app) => {
  const secretKey = 'secret-key'; //app.get('secret');

  return {
    sign (data, opts) {
      return new Promise((resolve, reject) => {
        jwt.sign(data, secretKey, opts, (err, token) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(token);
          }
        });
      });
    },
    verify (token) {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, authorizedData) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(authorizedData);
          }
        });
      });
    },
    async verifyExists (token) {
      const data = await this.verify(token)
      if (data.id) {
        return [data, await app.get('redis').exists(`users:${data.id}`)]
      }

      return false
    }
  }
}