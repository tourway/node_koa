const Koa = require('koa')
const app = new Koa()
const k2c = require('koa2-connect')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const proxy = require('koa2-nginx')  //引入代理模块

const options = {
  '/web-api':{
    target: 'https://webapi.gbex.co', 
    changeOrigin: true,
    pathRewrite: {
      '^/web-api': ''
    }
  }
}
const exampleProxy = proxy(options)
app.use(exampleProxy)

const { historyApiFallback } = require('koa2-connect-history-api-fallback');

const index = require('./routes/index')
const users = require('./routes/users')

// error handler
onerror(app)

// use historyApiFallback
app.use(historyApiFallback({ whiteList: ['/public'] }));

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
