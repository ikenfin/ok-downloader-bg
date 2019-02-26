const fs = require('fs');

module.exports = {
  get (name) {
    try {
      return fs.readFileSync(`/run/secrets/${name}`).toString('utf8').trim();
    }
    catch (e) {
      console.error(e);
      return false;
    }
  }
}