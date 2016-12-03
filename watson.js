const {denodeify} = require('./promise')
const watson = require('watson-developer-cloud')
const fs = require('fs')

const ToneAnalyzerVersion = '2016-05-19'

module.exports = config => {
  const speechToText = (videoId, audioFile, onLine) => {
    const speechToText = watson.speech_to_text(Object.assign({
      version: 'v1'
    }, config['speech-to-text']))

    const params = {
      content_type: 'audio/flac',
      audio: fs.createReadStream(audioFile),
      timestamps: true,
      continuous: true
    }

    // create the stream
    return denodeify(speechToText.recognize.bind(speechToText))(params)
  }

  const toneAnalyzer = text => {
    const toneAnalyzer = watson.tone_analyzer(Object.assign({
      version: 'v3',
      version_date: ToneAnalyzerVersion
    }, config['tone-analyzer']))

    return denodeify(toneAnalyzer.tone.bind(toneAnalyzer))({text})
  }

  const analyze = (videoId, audioFile) => {
    const transcriptFile = `videos/${videoId}.transcript`
    return denodeify(fs.readFile)(transcriptFile)
      .then(JSON.parse)
      .catch(() =>
        speechToText(videoId, audioFile)
          .then(transcript =>
            Promise.all(transcript.results.map(result =>
              toneAnalyzer(result.alternatives[0].transcript)
                .then(tone => Object.assign({}, result, tone))))
              .then(resultsWithTones => {
                transcript.results = resultsWithTones
                return transcript
              }))
          .then(transcript => denodeify(fs.writeFile)(transcriptFile, JSON.stringify(transcript)))
          .then(() => {
            console.log('Transcription complete.')
          }))
  }

  return {
    analyze,
    speechToText
  }
}
