module.exports = (redis, downloadsPath, uid) => {
  const rmrf = require('rimraf');
  const path = require('path');
  const zipPath = path.join(downloadsPath, uid + '.zip')

  return new Promise((resolve, reject) => {
    // remove zips
    rmrf(zipPath, (err) => {
      if (err) console.error('rmrf err', err)

      const pipeline = redis.pipeline()
      pipeline.del(`users:${uid}`)
      pipeline.zrem('completed-jobs', uid)
      pipeline.publish('user:deleted', uid)

      redis.keys(`zipped:${uid}:*`, (err, keys) => {
        keys.forEach(key => pipeline.del(key))

        pipeline.exec((err) => {
          console.log('pipeline exec...')
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  })
}