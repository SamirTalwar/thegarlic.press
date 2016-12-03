const watson = require('./watson')
const youtube = require('./youtube')
const fs = require('fs')

const flags = process.argv.slice(2)

if (flags[0] === 'transcribe') {
  const config = JSON.parse(fs.readFileSync('config.json'))

  youtube.getYouTubeAudio(flags[1])
    .then(watson.watsonSpeechToText.bind(this, config.watson))
    .then(function () {
      console.log('Done transcribing video id: ' + flags[1])
    })
    .catch(function (error) {
      console.error(error)
    })
}
