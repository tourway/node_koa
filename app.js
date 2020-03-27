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

/**  * 使用http代理请求转发，用于代理页面当中的http请求 * 这个代理请求得写在bodyparse的前面， *  */
// app.use(async(ctx, next) => {
//   console.log(ctx);
//   if (ctx.url.startsWith('/web-api')) {//匹配有api字段的请求url
//     ctx.respond = false // 绕过koa内置对象response ，写入原始res对象，而不是koa处理过的response        
//     await k2c(httpProxy({        
//       target: 'https://webapi.gbex.co',         
//       changeOrigin: true,        
//       secure: false,        
//       pathRewrite: {        
//         '^/web-api': ''
//       }        
//     }))(ctx,next);    
//   }    
//   await next()
// })


// app.use(async (ctx, next) => {
//   ctx.set('Access-Control-Allow-Origin', 'https://webapi.gbex.co/');
//   ctx.set('Access-Control-Allow-Methods', 'PUT,DELETE,POST,GET');
//   ctx.set('Access-Control-Max-Age', 3600 * 24);
//   await next();
//  });

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
