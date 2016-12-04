const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

function extract (config, videoId, timestamps) {
  if (timestamps.length === 0) {
    return Promise.resolve([])
  }
  const videoFile = path.join(config.video_dir, `${videoId}.mp4`)
  const snapshotsDir = path.join(config.video_dir, 'snapshots')
  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        timestamps,
        filename: `${videoId}-%s.png`,
        folder: snapshotsDir,
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
    .then(() => timestamps)
}
