const cron = require('node-cron')
const path = require('path')
const secret = require('./helpers/secrets')
const Redis = require('ioredis')
const cleaner = require('./helpers/cleaner')

const SECONDS_IN_2_HOURS = 7200

const downloadsPath = path.join(__dirname, '../ok-downloader-data/');

const config = {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379
  },
  downloadsPath
}
const networkKeys = {
  applicationSecretKey: secret.get('ok_secret_key'),
  applicationKey: secret.get('ok_public_key'),
  applicationId: secret.get('ok_app_id')
}

require('./downloader')(config)
  .makeListener(networkKeys);

cron.schedule('0 0 */2 * * *', () => {
  const redisClient = new Redis(config.redis.host, config.redis.port)
  console.log('scheduled task...')
  // get old tasks
  const to = Date.now() - SECONDS_IN_2_HOURS

  redisClient.zrange('completed-jobs', 0, to).then(values => {
    const promises = values.map(uid => {
      try {
        return cleaner(redisClient, downloadsPath, uid)
      }
      catch (e) {
        return null
      }
    })

    Promise.all(promises).then(() => {
      redisClient.zremrangebyscore('completed-jobs', 0, to)
        .then(() => {
          console.log('Ok, cleaned...')
        })
        .catch(err => {
          console.error('cron err', err)
        })
    })
  })
})