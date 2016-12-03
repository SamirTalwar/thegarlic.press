const watson = require('./watson')
const youtube = require('./youtube')
const fs = require('fs')

const flags = process.argv.slice(2)

if (flags[0] === 'transcribe') {
  const config = JSON.parse(fs.readFileSync('config.json'))
  const videoId = flags[1]

  console.log(`Video ID: ${videoId}`)
  youtube.getYouTubeAudio(videoId)
    .then(watson.watsonSpeechToText.bind(this, config.watson, videoId))
    .then(() => {
      console.log('Done.')
    })
    .catch(console.error)
}
