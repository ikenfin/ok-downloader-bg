const Redis = require('ioredis');

module.exports = function (config) {
  const PROCESSES = process.env.PROCESSES || 5;

  const queueOptions = {
    createClient: (type) => {
      if (config.redis.client) {
        return config.redis.client;
      }
      else {
        return new Redis(`redis://${config.redis.host}:${config.redis.port}`)
      }
    }
  }

  const Queue = require('bull'),
        PhotoDownloader = new Queue('Download photos from OK', queueOptions);

  return {
    makeListener: function (networkKeys) {
      PhotoDownloader.process(PROCESSES, function (job, done) {
        const okApi = require('./helpers/ok')(networkKeys),
              downloader = require('./helpers/downloader')(okApi),
              path = require('path'),
              rmrf = require('rimraf');

        okApi.setToken(job.data.access_token);

        const albums = job.data.albums,
              count = albums.length,
              percentRatio = 95 / count;

        let promises = [];

        // console.log('albums:', albums);
        for (let i = 0; i < albums.length; i++) {
          // make user album directory
          let albumDownloadPath = path.join(config.downloadsPath, job.data.uid, albums[i].title);

          promises.push(downloader.downloadAlbum(albumDownloadPath, albums[i].title, albums[i].aid).then(() => {
            job.progress(job._progress + percentRatio);
          }));
        }

        Promise.all(promises)
          .then(() => {
            const src = path.join(config.downloadsPath, job.data.uid)
            const target = path.join(config.downloadsPath, job.data.uid + '.zip')
            downloader.makeZip(src, target)
              .then((zipPath) => {
                rmrf(src, err => {
                  if (err) {
                    console.log(err)
                  }

                  job.progress(job._progress + 5)
                  done(null, { zipPath })
                })
              })
          })
      });
    },
    queue: PhotoDownloader
  }
}