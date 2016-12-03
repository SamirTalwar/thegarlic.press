const {denodeify} = require('./promise')
const spawn = require('child_process').spawn
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const request = require('request-promise-native')

module.exports = config => {
  return {
    info: videoId =>
      request({
        url: 'https://www.googleapis.com/youtube/v3/videos',
        qs: {
          part: 'snippet',
          id: videoId,
          key: config.api_key
        },
        json: true
      })
        .then(result => result.items[0]),

    download: videoId => {
      const videoUrl = `http://www.youtube.com/watch?v=${videoId}`
      const fileFormat = `videos/${videoId}.%(ext)s`
      const audioMp3File = `videos/${videoId}.mp3`
      const audioFlacFile = `videos/${videoId}.flac`

      return denodeify(fs.stat)(audioFlacFile)
        .catch(() =>
          new Promise((resolve, reject) => {
            const youtubeDl = spawn('youtube-dl', [
              '--extract-audio',
              '--keep-video',
              '--audio-format=mp3',
              `--output=${fileFormat}`,
              videoUrl
            ])

            youtubeDl.stdout.on('data', data => {
              console.log(data.toString())
            })
            youtubeDl.stderr.on('data', data => {
              process.stderr.write(data)
            })

            youtubeDl.on('exit', resolve)
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
