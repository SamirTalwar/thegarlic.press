var TONE_THREASHOLD = 0.5

function topTone(list) {
  var filtered = list.filter(x => x.score > TONE_THREASHOLD)
  if (filtered.length === 0) {return null}
  var sorted = list.filter(x => x.score > 0.2).sort((x,y) => y.score - x.score)
  return sorted[0].tone_id
}

function speakerOfWord(raw, time) {
  var res = null
  raw.speaker_labels.forEach(label => {
    if (label.from <= time && time <= label.to) {
      res = label.speaker
    }
  })
  return res
}

function speakerAtTime(raw, alt) {
  var counts = {}
  var maxCount = 0
  alt.timestamps
    .map(t => speakerOfWord(raw, ((t[1] + t[2])/ 2)))
    .forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
      maxCount = Math.max(maxCount, counts[v])
  })
  var maxVal = null
  Object.keys(counts).forEach(k => {
    if (counts[k] === maxCount) {
      maxVal = k
    }
  })
  return maxVal
}

function sentencies(raw) {
  return raw.results.map(x => {
    var alt = x.alternatives[0]
    var text = alt.transcript
    var start = alt.timestamps[0][1]
    var speaker = speakerAtTime(raw, alt)
    var end = alt.timestamps[alt.timestamps.length - 1][2]
    var tones = x.document_tone.tone_categories
    var tones = {}
    x.document_tone.tone_categories.forEach(t => {
      const val = topTone(t.tones)
      if (val) {
        tones[t.category_id] = val
      }
    })
    return Object.assign({}, {text, start, end, speaker}, tones)
  })
}

function groupBySpeaker(list) {
  var arr = []
  var lastSpeaker = null
  list.forEach(o => {
    if (o.speaker !== lastSpeaker) {
      lastSpeaker = o.speaker
      arr.push({
        speaker: o.speaker,
        start: o.start,
        end: o.end,
        sentencies: [o]
      })
    } else {
      var last = arr[arr.length - 1]
      last.end = o.end
      last.sentencies.push(o)
    }
  })
  return arr
}

module.exports = (x) => groupBySpeaker(sentencies(x))
