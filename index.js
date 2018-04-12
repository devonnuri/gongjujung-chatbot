const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const Parser = require('./Parser')

const app = new Koa()
const router = new Router()

const PORT = process.env.PORT || 8080
const UTC_OFFSET = +9

let latestMeal = new Map()

app.use(bodyParser())

const getLocalDate = offset => {
  let date = new Date()
  let utc = date.getTime() + date.getTimezoneOffset() * 60000
  offset = offset !== undefined ? 86400000 * offset : 0
  return new Date(utc + UTC_OFFSET * 3600000 + offset)
}

const loadMeal = () => {
  for (let i = -3; i <= 3; i++) {
    Parser.getMeal(getLocalDate(i)).then(body => {
      latestMeal.set(i, body)
    })
  }
}

const randomArray = array => {
  return array[Math.floor(Math.random * array.length)]
}

router.get('/', (ctx, next) => {
  ctx.body = '<h1>You have the wrong number lul :(</h1>'
})

router.get('/keyboard', (ctx, next) => {
  let data = {
    'type': 'buttons',
    'buttons': ['오늘 급식'],
  }

  ctx.body = data
})

router.post('/message', async (ctx, next) => {
  let param = ctx.request.body
  let message = param.content

  let data = {
    message: {},
    keyboard: {
      type: 'buttons',
      buttons: []
    }
  }

  if (message.includes('급식')) {
    if (message.includes('내일')) {
      data.message['text'] = latestMeal.get(1)
    } else if (message.includes('어제')) {
      data.message['text'] = latestMeal.get(-1)
    } else {
      // If Nothing, return Just Today
      data.message['text'] = latestMeal.get(0)
    }
    data.keyboard.buttons = ['오늘 급식 알려줘', '내일 급식 알려줘', '어제 급식 알려줘']
  } else {
    data.message['text'] = '뭐라는지 모르겠어 ㅠㅠ\n기능 제안이나 버그 제보는 항상 받고 있으니 언제나 알려달라고!'
  }

  ctx.body = data
})

app.listen(PORT, () => {
  console.log(`listening to port ${PORT}`)
  console.log(`I am READY!!`)

  // Prevent Sleeping & Fast Loading

  loadMeal()
  setInterval(() => loadMeal(), 300000)
})

app
  .use(router.routes())
  .use(router.allowedMethods())
