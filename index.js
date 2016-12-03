const watson = require('./watson')
const youtube = require('./youtube')
const fs = require('fs')
const path = require('path')
const koa = require('koa')
const route = require('koa-route')
const render = require('koa-ejs')
const serve = require('koa-static')

const config = JSON.parse(fs.readFileSync('config.json'))

const app = koa()

render(app, {
  root: path.join(__dirname, 'view'),
  cache: false
})

app.use(serve(path.join(__dirname, 'public')))

app.use(route.get('/:videoId', function*(videoId) {
  console.log(`HTTP GET /${videoId}`)
  const transcript = yield youtube.getYouTubeAudio(videoId)
    .then(watson.watsonSpeechToText.bind(this, config.watson, videoId))
  yield this.render('article', {
    title: 'Youtube video',
    transcript: transcript.sort((a, b) => a.result_index - b.result_index).map(t => {
      return {
        type: 'text',
        value: t.results[0].alternatives.sort((a, b) => a.confidence - b.confidence)[0].transcript
      }
    }),
    metadata: {}
  })
}))

new Promise(resolve => {
  const server = app.listen(config.port, () => resolve(server))
})
  .then(server => new Promise(resolve => {
    console.log(`Application started on port ${config.port}.`)
    ;['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => server.close(resolve))
    })
  }))
  .then(() => console.log('Application stopped.'))
  .catch(console.error)
