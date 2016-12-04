const fs = require('fs')
const path = require('path')
const koa = require('koa')
const route = require('koa-route')
const render = require('koa-ejs')
const serve = require('koa-static')

const Watson = require('./watson')
const YouTube = require('./youtube')

const config = JSON.parse(fs.readFileSync('config.json'))
const watson = Watson(config.watson)
const youtube = YouTube(config.youtube)

const app = koa()

render(app, {
  root: path.join(__dirname, 'view'),
  cache: false
})

app.use(serve(path.join(__dirname, 'public')))

app.use(route.get('/:videoId.transcript', function*(videoId) {
  console.log(`HTTP GET /${videoId}.transcript`)
  this.type = 'application/json'
  this.body =
    yield youtube.info(videoId)
      .then(video =>
        youtube.download(videoId)
          .then(audioFile => watson.analyze(video, audioFile)))
}))

app.use(route.get('/:videoId', function*(videoId) {
  console.log(`HTTP GET /${videoId}`)
  const transcript = yield youtube.download(videoId)
    .then(audioFile => watson.analyze(videoId, audioFile))
  this.type = 'text/html'
  yield this.render('article', {
    title: 'Youtube video',
    transcript: transcript.results.map(result => {
      return {
        type: 'text',
        value: result.alternatives[0].transcript
      }
    }),
    metadata: {
      concepts: require('./mock/concept.json')
    }
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
