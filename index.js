const watson = require('./watson')
const youtube = require('./youtube')
const path = require('path')

const flags = process.argv.slice(2)

if (flags[0] === 'transcribe') {
  youtube.getYouTubeAudio(flags[1])
    .then(watson.watsonSpeechToText.bind(this, path.join(__dirname, 'file.flac')))
    .then(function () {
      console.log('Done transcribing video id: ' + flags[1])
    })
    .catch(function (error) {
      console.error(error)
    })
}
