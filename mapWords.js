var RELEVANCE_THREASHOLD = 0.7

module.exports = (transcript) => {
  transcript.bySpeaker.forEach(x => {
    x.sentences.forEach(s => {
      var splits = [s.text.length - 1]
      s.keywords = []
      var keywordsMap = {}
      transcript.keywords.forEach(k => {
        var index = s.text.indexOf(k.text)
        if (index > -1 && k.relevance > RELEVANCE_THREASHOLD) {
          s.keywords.push(Object.assign({}, k, {index}))
          splits.push(index)
          splits.push(index + k.text.length)
          keywordsMap[index] = k
        }
      })
      s.concepts = []
      var conceptsMap = {}
      transcript.concepts.forEach(c => {
        var index = s.text.indexOf(c.text)
        if (index > -1) {
          s.concepts.push(Object.assign({}, c, {index}))
          splits.push(index)
          splits.push(index + c.text.length)
          conceptsMap[index] = c
        }
      })
      splits = splits.sort((x, y) => x - y)
      var blocks = [[0, splits[0]]]
      var lastSplit = splits[0]
      splits.forEach(p => {
        if (p > lastSplit) {
          blocks.push([lastSplit, p])
          lastSplit = p
        }
      })
      s.words = blocks.map(t => {
        var index = t[0]
        var info = {}
        if (keywordsMap[index]) {
          info.isKeyword = true
          Object.assign(info, keywordsMap[index])
        }
        if (conceptsMap[index]) {
          info.isConcept = true
          Object.assign(info, conceptsMap[index])
        }
        return {
          text: s.text.slice(t[0], t[1]),
          info
        }
      })
      s.words[0].text = s.words[0].text.replace(/^\w/, l => l.toUpperCase())
      s.words[s.words.length - 1].text = s.words[s.words.length - 1].text.replace(/ $/, '.')
    })
  })
}
