const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

function extract (config, videoId, timestamps) {
  const videoFile = path.join(config.video_dir, `${videoId}.mp4`)
  console.log('TIMESTAMPS: ' + JSON.stringify(timestamps))
  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .on('end', () => {
        console.log('ENDED!')
        resolve()
      })
      .on('error', (err) => {
        console.error(err)
        reject(err)
      })
      .screenshots({
        timestamps,
        filename: `${videoId}-%s.png`,
        folder: './public/snapshots',
        size: '200x?'
      })
  })
}

module.exports = (config, transcript) => {
  transcript.bySpeaker.forEach(x => {
    x.screenshotTime = Math.round((x.start + x.end) / 2)
  })
  var timestamps = transcript.bySpeaker.map(x => x.screenshotTime)
  return extract(config, transcript.video.id, timestamps)
}
