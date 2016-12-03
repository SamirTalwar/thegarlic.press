const ffmpeg = require('fluent-ffmpeg')

module.exports = function (videoId, timestamps) {
  const videoFile = `videos/${videoId}.mkv`
  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        timestamps,
        filename: `${videoId}-%s.png`,
        folder: './public/snapshots',
        size: '200x?'
      })
  })
}
