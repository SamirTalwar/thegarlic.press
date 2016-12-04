const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

function extract (config, videoId, timestamps) {
  const videoFile = path.join(config.video_dir, `${videoId}.mp4`)
  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .screenshots({
        timestamps,
        filename: `${videoId}-%s.png`,
        folder: './public/snapshots',
        size: '200x?'
      })
      .on('end', resolve)
      .on('error', reject)
  })
}

module.exports = (config, transcript) => {
  transcript.bySpeaker.forEach(x => {
    x.screenshotTime = Math.round((x.start + x.end) / 2)
  })
  var timestamps = transcript.bySpeaker.map(x => x.screenshotTime)
  return extract(config, transcript.video.id, timestamps)
}
