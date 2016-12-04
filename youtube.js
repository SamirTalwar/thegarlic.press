const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const request = require('request-promise-native')

const {denodeify} = require('./promise')

module.exports = config => {
  return {
    info: videoId =>
      request({
        url: 'https://www.googleapis.com/youtube/v3/videos',
        qs: {
          part: 'snippet',
          id: videoId,
          key: config.youtube.api_key
        },
        json: true
      })
        .then(result => result.items[0]),

    download: videoId => {
      const videoUrl = `http://www.youtube.com/watch?v=${videoId}`
      const fileFormat = path.join(config.video_dir, `${videoId}.%(ext)s`)
      const audioMp3File = path.join(config.video_dir, `${videoId}.mp3`)
      const audioFlacFile = path.join(config.video_dir, `${videoId}.flac`)

      return denodeify(fs.stat)(audioFlacFile)
        .catch(() =>
          new Promise((resolve, reject) => {
            const youtubeDl = childProcess.spawn('youtube-dl', [
              '--extract-audio',
              '--keep-video',
              '--audio-format=mp3',
              `--output=${fileFormat}`,
              videoUrl
            ], {
              stdio: 'inherit'
            })

            youtubeDl.on('exit', code => {
              if (code === 0) {
                resolve()
              } else {
                reject()
              }
            })
            youtubeDl.on('error', reject)
          })
          .then(() => new Promise((resolve, reject) => {
            ffmpeg(audioMp3File)
              .output(audioFlacFile)
              .on('end', resolve)
              .on('error', reject)
              .run()
          })))
        .then(() => audioFlacFile)
    }
  }
}
