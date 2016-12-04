const fs = require('fs')
const path = require('path')
const watson = require('watson-developer-cloud')

const groupBySpeaker = require('./groupBySpeaker')
const addScreenshots = require('./addScreenshots')
const {augment} = require('./munge')
const {denodeify} = require('./promise')
const mapWords = require('./mapWords')
const ToneAnalyzerVersion = '2016-05-19'

module.exports = config => {
  const watsonSpeechToText = watson.speech_to_text(Object.assign({
    version: 'v1',
    model: 'en-US_NarrowbandModel',
    speaker_labels: true
  }, config.watson['speech-to-text']))
  const watsonToneAnalyzer = watson.tone_analyzer(Object.assign({
    version: 'v3',
    version_date: ToneAnalyzerVersion
  }, config.watson['tone-analyzer']))
  const alchemyLanguage = watson.alchemy_language(Object.assign({
    version: 'v1'
  }, config.watson['alchemy-language']))

  const api = {
    recognize: denodeify(watsonSpeechToText.recognize.bind(watsonSpeechToText)),
    tone: denodeify(watsonToneAnalyzer.tone.bind(watsonToneAnalyzer)),
    concepts: denodeify(alchemyLanguage.concepts.bind(alchemyLanguage)),
    keywords: denodeify(alchemyLanguage.keywords.bind(alchemyLanguage))
  }

  const speechToText = audioFile =>
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

  const analyze = (video, audioFile) => {
    console.log(`${video.id}: Analysing...`)
    const transcriptFile = path.join(config.video_dir, `${video.id}.transcript`)
    return denodeify(fs.readFile)(transcriptFile)
      .then(JSON.parse)
      .catch(() => {
        console.log(`${video.id}: Converting speech to text...`)
        return speechToText(audioFile)
      })
      .then(augment(transcript => transcript.video, transcript => {
        console.log(`${video.id}: Appending video information...`)
        transcript.video = video
      }))
      .then(augment(transcript => transcript.text, transcript => {
        console.log(`${video.id}: Concatenating text...`)
        transcript.text = transcript.results.map(result => result.alternatives[0].transcript).join('\n')
      }))
      .then(augment(transcript => transcript.results[0].document_tone, transcript => {
        console.log(`${video.id}: Identifying tone...`)
        return Promise.all(transcript.results.map(result =>
          toneAnalyzer(result.alternatives[0].transcript)
            .then(tone => Object.assign({}, result, tone))))
          .then(resultsWithTones => {
            transcript.results = resultsWithTones
          })
      }))
      .then(augment(transcript => transcript.concepts, transcript => {
        console.log(`${video.id}: Extracting concepts...`)
        return concepts(transcript.text)
          .then(result => {
            transcript.concepts = result.concepts
          })
      }))
      .then(augment(transcript => transcript.keywords, transcript => {
        console.log(`${video.id}: Extracting keywords...`)
        return keywords(transcript.text)
          .then(result => {
            transcript.keywords = result.keywords
          })
      }))
      .then(augment(transcript => transcript.bySpeaker, transcript => {
        console.log(`${video.id}: Group by speaker and add screenshots...`)
        transcript.bySpeaker = groupBySpeaker(transcript)
        mapWords(transcript)
        return addScreenshots(config, transcript)
      }))
      .then(augment(() => false, transcript => {
        console.log(`${video.id}: Saving...`)
        return denodeify(fs.writeFile)(transcriptFile, JSON.stringify(transcript, null, 2))
          .then(() => {
            console.log(`${video.id}: Analysis complete.`)
          })
      }))
  }

  return {
    analyze
  }
}
