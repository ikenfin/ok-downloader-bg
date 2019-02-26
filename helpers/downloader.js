module.exports = function (okApi) {
  const download = require('download-file');
  const mkdirp = require('mkdirp');
  const archiver = require('archiver');
  const fs = require('fs');

  return {
    makeZip: function (path, outputPath) {
      return new Promise((resolve, reject) => {
        // console.log(path, output)
        // setTimeout(resolve, 3000)
        const output = fs.createWriteStream(outputPath)
        const archive = archiver('zip', {
          zlib: {
            level: 9
          },
          cwd: path
        })
        output.on('close', () => {
          console.log('zip: ', archive.pointer())
          resolve(outputPath)
        })

        output.on('error', reject)

        archive.pipe(output)

        archive.directory(path, false)
        archive.finalize()
      })
    },

    downloadAlbum: function (downloadPath, title, aid) {
      // let downloadPath = app.get('downloads-path') + '/' + title;
      mkdirp.sync(downloadPath, 0775);

      return okApi.getPhotos(aid)
        .then(data => this.downloadPhotos(downloadPath, data));
    },

    downloadPhotos: function (downloadPath, data) {
      let promises = data.map(photo => {
        return new Promise((resolve, reject) => {
          download(
            photo.pic_max,
            {
              filename: photo.id + '.jpg',
              directory: downloadPath
            },
            (err) => {
              if (err) {
                console.error('download err', err);
              }

              resolve();
            }
          )
        });
      });

      return Promise.all(promises);
    }
  }
}