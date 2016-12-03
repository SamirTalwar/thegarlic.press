const watson = require('watson-developer-cloud')
const fs = require('fs')
const path = require('path')

exports.watsonSpeechToText = function (config, audioFile) {
  const speechToText = watson.speech_to_text(Object.assign({
    version: 'v1',
    url: 'https://stream.watsonplatform.net/speech-to-text/api'
  }, config))

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

    recognizeStream.on('results', event => {
      if (event.results[0].final) {
        results.push(event)
      }
    })

    ;['data', 'error', 'end'].forEach(function (eventName) {
      recognizeStream.on(eventName, console.log.bind(console, eventName + ' event:'))
    })

    recognizeStream.on('error', reject)

    recognizeStream.on('end', function () {
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
