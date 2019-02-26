"use strict";
module.exports = function(keys) {
  let okapi = require('ok.ru');
  let request = require('request');

  okapi.setOptions({
    applicationSecretKey : keys['applicationSecretKey'],
    applicationKey : keys['applicationKey'],
    applicationId : keys['applicationId']
  });

  return {
    client: okapi,

    setToken: function (token) {
      this.client.setAccessToken(token);
      return this;
    },

    getToken: function () {
      return this.client.getAccessToken()
    },

    getAuthUrl : function(redirect_uri) {
      let client_id = keys['applicationId'],
          scope = ['VALUABLE_ACCESS','PHOTO_CONTENT','LONG_ACCESS_TOKEN'].join(';'),
          response_type = 'code',
          layout = 'w';

      let url = `https://connect.ok.ru/oauth/authorize?client_id=${client_id}&scope=${scope}&response_type=${response_type}&redirect_uri=${redirect_uri}&layout=${layout}`;

      return url;
    },

    auth : function(code, redirect_url) {
      return this.retrieveAccessToken(code, redirect_url)
    },

    getUserAlbum: function () {
      let opts = {
        method: 'photos.getPhotos',
        fields: [
          'album.PHOTOS_COUNT',
          'photo.PIC320MIN'
        ]
      }

      return new Promise((resolve, reject) => {
        okapi.get(opts, (err, data) => {
          if (err) {
            console.error('album err', err)
            reject(err)
          }
          else {
            let response = {
              aid: null,
              title: 'Личные фотографии',
              photos_count: data.totalCount
            }
            // console.log('test:', data)
            if (data.totalCount > 0
                && data.photos[0]
                && data.photos[0].pic320min
            ) {
              response.main_photo = {
                pic320min: data.photos[0].pic320min
              }
            }

            resolve(response)
          }
        })
      })
    },

    getAlbums: function (pagingAnchor = null, albums = []) {
      let opts = {
        method: 'photos.getAlbums',
        fields: [
          'album.AID',
          'album.LIKE_COUNT',
          'album.TITLE',
          'album.PHOTOS_COUNT',
          'album.MAIN_PHOTO',
          'photo.PIC320MIN',
        ]
      }

      if (pagingAnchor) {
        opts.pagingAnchor = pagingAnchor
      }

      return new Promise((resolve, reject) => {
        okapi.get(opts, (err, data) => {
          if (err) {
            // console.error(err);
            reject(err)
          }
          else {
            albums = albums.concat(data.albums)

            if (data.pagingAnchor) {
              resolve(this.getAlbums(data.pagingAnchor, albums))
            }
            else {
              resolve(albums)
            }
          }
        });
      });
    },

    getPhotos: function (aid, anchor = null, pics = []) {
      let opts = {
        method: 'photos.getPhotos',
        fields: [
          'photo.PIC_BASE',
          'photo.PIC_MAX',
          'photo.PIC128X128',
          'photo.ID'
        ]
      }

      if (aid) {
        opts.aid = aid
      }

      if (anchor) {
        opts.anchor = anchor
      }

      return new Promise((resolve, reject) => {
        okapi.get(opts, (err, data) => {
          if (err) {
            reject(err);
          }
          else {
            pics = pics.concat(data.photos);
            if (data.anchor) {
              resolve(this.getPhotos(aid, data.anchor, pics));
            }
            else {
              resolve(pics);
            }
          }
        })
      });
    },

    getUserId: function () {
      return new Promise((resolve, reject) => {
        okapi.get({
          method: 'users.getLoggedInUser'
        }, (err, id) => {
          if (err) {
            reject(err);
          }
          else {
            // console.log(id);
            resolve(id);
          }
        })
      });
    },

    retrieveAccessToken : function(code, redirect_uri) {
      return new Promise( ( resolve, reject ) => {
        request.post(
          {
            // headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url : 'https://api.ok.ru/oauth/token.do',
            form : {
              code,
              redirect_uri,
              client_id : keys['applicationId'],
              client_secret : keys['applicationSecretKey'],
              grant_type : 'authorization_code'
            },
            json : true
          },
          (err, _response, body) => {
            if(err) {
              reject(err);
            }
            else {
              resolve(body)
            }
          });
      });
    },

    refreshToken (refresh_token) {
      return new Promise( ( resolve, reject ) => {
        request.post(
          {
            url : 'https://api.ok.ru/oauth/token.do',
            form : {
              refresh_token,
              client_id : keys['applicationId'],
              client_secret : keys['applicationSecretKey'],
              grant_type : 'refresh_token'
            },
            json : true
          },
          (err, _response, body) => {
            if (err) {
              reject(err)
            }
            else {
              resolve(body.access_token);
            }
          }
        )
      });
    }
  }
}