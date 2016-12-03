const watson = require('./watson')
const youtube = require('./youtube')
const fs = require('fs')
const koa = require('koa')
const route = require('koa-route')

const config = JSON.parse(fs.readFileSync('config.json'))

const app = koa()
app.use(route.get('/:videoId', function*(videoId) {
  console.log(`HTTP GET /${videoId}`)
  this.type = 'application/json'
  this.body = yield youtube.getYouTubeAudio(videoId)
    .then(watson.watsonSpeechToText.bind(this, config.watson, videoId))
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
