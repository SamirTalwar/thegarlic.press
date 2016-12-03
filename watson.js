const {denodeify} = require('./promise')
const watson = require('watson-developer-cloud')
const fs = require('fs')

module.exports = config => ({
  speechToText: (videoId, audioFile) => {
    const speechToText = watson.speech_to_text(Object.assign({
      version: 'v1',
      url: 'https://stream.watsonplatform.net/speech-to-text/api'
    }, config))

    const transcriptFile = `videos/${videoId}.transcript`
    return denodeify(fs.readFile)(transcriptFile)
      .catch(() => new Promise((resolve, reject) => {
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

        ;['data', 'error', 'end'].forEach(eventName => {
          recognizeStream.on(eventName, console.log.bind(console, eventName + ' event:'))
        })

        recognizeStream.on('error', reject)

        recognizeStream.on('end', () => {
          fs.writeFile(transcriptFile, JSON.stringify(results), error => {
            if (error) {
              reject(error)
            } else {
              console.log('Transcription complete.')
              resolve(results)
            }
          })
        })
      }))
  }
})
