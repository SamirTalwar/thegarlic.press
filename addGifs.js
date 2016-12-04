const request = require('request-promise-native')

module.exports = (config, transcript) =>
  Promise.all(transcript.bySpeaker.map(segment =>
    Promise.all(segment.sentences.map(sentence => {
      if (sentence.emotion_tone && sentence.emotion_tone.score > 0.5) {
        return request({
          url: 'http://api.giphy.com/v1/gifs/search',
          qs: {
            q: sentence.emotion_tone.tone_name,
            api_key: config.giphy.api_key
          },
          json: true
        })
          .then(data => data.data[Math.floor(Math.random() * data.data.length)])
          .then(gif => {
            sentence.gif = gif.images.fixed_height.url
          })
      } else {
        return Promise.resolve()
      }
    }))))
