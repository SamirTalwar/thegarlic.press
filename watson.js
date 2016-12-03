const {denodeify} = require('./promise')
const watson = require('watson-developer-cloud')
const fs = require('fs')

const ToneAnalyzerVersion = '2016-05-19'

module.exports = config => {
  const watsonSpeechToText = watson.speech_to_text(Object.assign({
    version: 'v1',
    model: 'en-US_NarrowbandModel',
    speaker_labels: true
  }, config['speech-to-text']))
  const watsonToneAnalyzer = watson.tone_analyzer(Object.assign({
    version: 'v3',
    version_date: ToneAnalyzerVersion
  }, config['tone-analyzer']))
  const alchemyLanguage = watson.alchemy_language(Object.assign({
    version: 'v1'
  }, config['alchemy-language']))

  const api = {
    recognize: denodeify(watsonSpeechToText.recognize.bind(watsonSpeechToText)),
    tone: denodeify(watsonToneAnalyzer.tone.bind(watsonToneAnalyzer)),
    concepts: denodeify(alchemyLanguage.concepts.bind(alchemyLanguage)),
    keywords: denodeify(alchemyLanguage.keywords.bind(alchemyLanguage))
  }

  const speechToText = (videoId, audioFile, onLine) =>
    api.recognize({
      content_type: 'audio/flac',
      audio: fs.createReadStream(audioFile),
      timestamps: true,
      continuous: true,
      model: 'en-US_NarrowbandModel',
      speaker_labels: true
    })
      .then(transcript => {
        transcript.results.forEach(result => {
          result.alternatives.sort((a, b) => a.confidence - b.confidence)
        })
        return transcript
      })

  const toneAnalyzer = text => api.tone({text})

  const concepts = text => api.concepts({text})

  const keywords = text => api.keywords({
    text,
    knowledgeGraph: 1,
    emotion: 1,
    sentiment: 1
  })

  const augment = (predicate, behaviour) => transcript => {
    if (predicate(transcript)) {
      return transcript
    }
    const result = behaviour(transcript)
    if (result && result.then) {
      return result.then(() => transcript)
    } else {
      return transcript
    }
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
      .then(augment(transcript => transcript.text, transcript => {
        console.log(`${videoId}: Concatenating text...`)
        transcript.text = transcript.results.map(result => result.alternatives[0].transcript).join('\n')
      }))
      .then(augment(transcript => transcript.results[0].document_tone, transcript => {
        console.log(`${videoId}: Identifying tone...`)
        return Promise.all(transcript.results.map(result =>
          toneAnalyzer(result.alternatives[0].transcript)
            .then(tone => Object.assign({}, result, tone))))
          .then(resultsWithTones => {
            transcript.results = resultsWithTones
          })
      }))
      .then(augment(transcript => transcript.concepts, transcript => {
        console.log(`${videoId}: Extracting concepts...`)
        return concepts(transcript.text)
          .then(result => {
            transcript.concepts = result.concepts
          })
      }))
      .then(augment(transcript => transcript.keywords, transcript => {
        console.log(`${videoId}: Extracting keywords...`)
        return keywords(transcript.text)
          .then(result => {
            transcript.keywords = result.keywords
          })
      }))
      .then(augment(() => false, transcript => {
        console.log(`${videoId}: Saving...`)
        return denodeify(fs.writeFile)(transcriptFile, JSON.stringify(transcript, null, 2))
          .then(() => {
            console.log(`${videoId}: Analysis complete.`)
          })
      }))
  }

  return {
    analyze
  }
}
