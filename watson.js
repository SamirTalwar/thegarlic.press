const {denodeify} = require('./promise')
const watson = require('watson-developer-cloud')
const fs = require('fs')

const ToneAnalyzerVersion = '2016-05-19'

module.exports = config => {
  const speechToText = (videoId, audioFile, onLine) => new Promise((resolve, reject) => {
    const speechToText = watson.speech_to_text(Object.assign({
      version: 'v1',
      url: 'https://stream.watsonplatform.net/speech-to-text/api'
    }, config['speech-to-text']))

    const params = {
      content_type: 'audio/flac',
      timestamps: true,
      continuous: true
    }

    // create the stream
    const recognizeStream = speechToText.createRecognizeStream(params)

    // pipe in some audio
    fs.createReadStream(audioFile).pipe(recognizeStream)

    // listen for 'data' events for just the final text
    // listen for 'results' events to get the raw JSON with interim results, timings, etc.

    recognizeStream.setEncoding('utf8') // to get strings instead of Buffers from `data` events

    recognizeStream.on('results', event => {
      if (event.results[0].final) {
        onLine(event)
      }
    })

    ;['data', 'error', 'end'].forEach(eventName => {
      recognizeStream.on(eventName, console.log.bind(console, eventName + ' event:'))
    })

    recognizeStream.on('error', reject)
    recognizeStream.on('end', resolve)
  })

  const toneAnalyzer = text => {
    const toneAnalyzer = watson.tone_analyzer(Object.assign({
      version: 'v3',
      version_date: ToneAnalyzerVersion
    }, config['tone-analyzer']))

    return denodeify(toneAnalyzer.tone.bind(toneAnalyzer))({text})
  }

  const analyze = (videoId, audioFile) => {
    const transcriptFile = `videos/${videoId}.transcript`
    const results = []
    return denodeify(fs.readFile)(transcriptFile)
      .then(JSON.parse)
      .catch(() =>
        speechToText(videoId, audioFile, event =>
          toneAnalyzer(event.results[0].alternatives[0].transcript).then(tone => {
            results.push(Object.assign({}, event, tone))
          }))
        .then(() => denodeify(fs.writeFile)(transcriptFile, JSON.stringify(results)))
        .then(() => {
          console.log('Transcription complete.')
        }))
  }

  return {
    analyze,
    speechToText
  }
}
