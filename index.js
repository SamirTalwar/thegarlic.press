const fs = require('fs')
const path = require('path')
const koa = require('koa')
const route = require('koa-route')
const render = require('koa-ejs')
const serve = require('koa-static')

const Watson = require('./watson')
const YouTube = require('./youtube')

const config = JSON.parse(fs.readFileSync('config.json'))
config.video_dir = path.resolve(__dirname, config.video_dir)

const watson = Watson(config)
const youtube = YouTube(config)

const app = koa()

render(app, {
  root: path.join(__dirname, 'view'),
  cache: false
})

const analyse = videoId =>
  youtube.info(videoId)
    .then(video =>
      youtube.download(videoId)
        .then(audioFile => watson.analyze(video, audioFile)))

app.use(serve(path.join(__dirname, 'public')))
app.use(serve(config.video_dir))

app.use(route.get('/', function*() {
  console.log(`HTTP GET /`)
  this.type = 'text/html'
  yield this.render('body')
}))

app.use(route.get('/:videoId.transcript', function*(videoId) {
  console.log(`HTTP GET /${videoId}.transcript`)
  this.type = 'application/json'
  this.body = yield analyse(videoId)
}))

app.use(route.get('/:videoId', function*(videoId) {
  console.log(`HTTP GET /${videoId}`)
  const transcript = yield Promise.race([
    analyse(videoId),
    new Promise(resolve => {
      setTimeout(() => resolve(), 3000)
    })
  ])
  this.type = 'text/html'
  if (!transcript) {
    yield this.render('waiting')
  } else {
    yield this.render('article', transcript)
  }
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
