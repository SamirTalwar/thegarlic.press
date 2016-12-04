var RELEVANCE_THREASHOLD = 0.7

module.exports = (transcript) => {
  transcript.bySpeaker.forEach(x => {
    x.sentences.forEach(s => {
      s.keywords = []
      transcript.keywords.forEach(k => {
        var index = s.text.indexOf(k.text)
        if (index > -1 && k.relevance > RELEVANCE_THREASHOLD) {
          s.keywords.push(Object.assign({}, k, {index}))
        }
      })
      s.concepts = []
      transcript.concepts.forEach(c => {
        var index = s.text.indexOf(c.text)
        if (index > -1) {
          s.concepts.push(Object.assign({}, c, {index}))
        }
      })
    })
  })
}
