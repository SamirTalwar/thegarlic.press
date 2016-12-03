var watson = require('watson-developer-cloud')
var fs = require('fs')
var path = require('path')
var Promise = require('bluebird')

var speechToText = watson.speech_to_text({
  username: <YOUR CREDS HERE>,
  password: <YOUR CREDS HERE>,
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api'
})

exports.watsonSpeechToText = function (audioFile) {
  return new Promise(function (resolve, reject) {
    var params = {
      content_type: 'audio/flac',
      timestamps: true,
      continuous: true
    }

    var results = []

    // create the stream
    var recognizeStream = speechToText.createRecognizeStream(params)

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
      var transcriptFile = path.join(__dirname, 'transcript.json')

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
