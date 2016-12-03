const watson = require('watson-developer-cloud')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')

const speechToText = watson.speech_to_text({
  username: <YOUR CREDS HERE>,
  password: <YOUR CREDS HERE>,
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api'
})

exports.watsonSpeechToText = function (audioFile) {
  return new Promise(function (resolve, reject) {
    const params = {
      content_type: 'audio/flac',
      timestamps: true,
      continuous: true
    }

    const results = []

    // create the stream
    const recognizeStream = speechToText.createRecognizeStream(params)

    // pipe in some audio
    fs.createReadStream(audioFile).pipe(recognizeStream)

    // listen for 'data' events for just the final text
    // listen for 'results' events to get the raw JSON with interim results, timings, etc.

    recognizeStream.setEncoding('utf8') // to get strings instead of Buffers from `data` events

    recognizeStream.on('results', function (e) {
      if (e.results[0].final) {
        results.push(e)
      }
    });

    ['data', 'results', 'error', 'connection-close'].forEach(function (eventName) {
      recognizeStream.on(eventName, console.log.bind(console, eventName + ' event: '))
    })

    recognizeStream.on('error', reject)

    recognizeStream.on('connection-close', function () {
      const transcriptFile = path.join(__dirname, 'transcript.json')

      fs.writeFile(transcriptFile, JSON.stringify(results), function (err) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}
