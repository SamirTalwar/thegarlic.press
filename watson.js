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

  const concepts = text => {
    const alchemyLanguage = watson.alchemy_language(Object.assign({
      version: 'v1'
    }, config['alchemy-language']))

    return denodeify(alchemyLanguage.concepts.bind(alchemyLanguage))({text})
  }

  const analyze = (videoId, audioFile) => {
    console.log(`${videoId}: Analysing...`)
    const transcriptFile = `videos/${videoId}.transcript`
    return denodeify(fs.readFile)(transcriptFile)
      .then(JSON.parse)
      .catch(() => {
        console.log(`${videoId}: Converting speech to text...`)
        return speechToText(videoId, audioFile)
      })
      .then(transcript => {
        if (transcript.results[0].document_tone) {
          return transcript
        }
        console.log(`${videoId}: Identifying tone...`)
        return Promise.all(transcript.results.map(result =>
          toneAnalyzer(result.alternatives[0].transcript)
            .then(tone => Object.assign({}, result, tone))))
          .then(resultsWithTones => {
            transcript.results = resultsWithTones
            return transcript
          })
      })
      .then(transcript => {
        if (transcript.concepts) {
          return transcript
        }
        console.log(`${videoId}: Extracting concepts...`)
        return concepts(transcript.results.map(result => result.alternatives[0].transcript).join('\n'))
          .then(result => {
            transcript.concepts = result.concepts
            return transcript
          })
      })
      .then(transcript => {
        console.log(`${videoId}: Saving...`)
        return denodeify(fs.writeFile)(transcriptFile, JSON.stringify(transcript))
          .then(() => {
            console.log(`${videoId}: Analysis complete.`)
            return transcript
          })
      })
  }

  return {
    analyze,
    speechToText
  }
}
