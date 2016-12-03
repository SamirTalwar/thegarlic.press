const spawn = require('child_process').spawn
const Promise = require('bluebird')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')

exports.getYouTubeAudio = function (videoId) {
  return new Promise(function (resolve, reject) {
      // Install youtube-dl locally: brew install youtube-dl
    const youtubeDl = spawn('youtube-dl', ['--extract-audio', '--audio-format', 'mp3', '-o', 'file.%(ext)s', 'http://www.youtube.com/watch?v=' + videoId])

    youtubeDl.stdout.on('data', function (data) {
      console.log(data.toString())
    })

    youtubeDl.stderr.on('data', function (data) {
      process.stderr.write(data)
    })

    // brew install ffmpeg
    youtubeDl.on('exit', function () {
      const mp3File = path.join(__dirname, 'file.mp3')
      const flacFile = path.join(__dirname, 'file.flac')
      ffmpeg(mp3File)
        .output(flacFile)
        .on('end', function () {
          resolve()
        })
        .on('error', function (err) {
          reject(err)
        })
        .run()
    })
  })
}
