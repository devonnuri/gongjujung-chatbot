const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const Parser = require('./Parser')

const app = new Koa()
const router = new Router()

const PORT = process.env.PORT || 8080
const UTC_OFFSET = +9

const KOREAN_DATE = {
  '그끄제': -3,
  '그저께': -2,
  '그제': -2,
  '어제': -1,
  '오늘': 0,
  '모레': 2,
  '내일': 1,
  '글피': 3,
  '그글피': 4,
}

let latestMeal = new Map()

app.use(bodyParser())

const getLocalDate = offset => {
  let date = new Date()
  let utc = date.getTime() + date.getTimezoneOffset() * 60000
  offset = offset !== undefined ? 86400000 * offset : 0
  return new Date(utc + UTC_OFFSET * 3600000 + offset)
}

const loadMeal = () => {
  for (let i = -4; i <= 4; i++) {
    Parser.getMeal(getLocalDate(i)).then(body => {
      latestMeal.set(i, body)
    })
  }
}

const getDateWithOffset = message => {
  for (let key in KOREAN_DATE) {
    if (message.includes(key)) {
      return getLocalDate(KOREAN_DATE[key])
    }
  }
  return getLocalDate(0)
}

router.get('/', (ctx, next) => {
  ctx.body = '<h1>You have the wrong number lul :(</h1>'
})

router.get('/keyboard', (ctx, next) => {
  let data = {
    'type': 'text',
  }

  ctx.body = data
})

router.post('/message', async (ctx, next) => {
  let param = ctx.request.body
  let message = param.content

  let data = {
    message: {},
  }

  if (message.includes('급식')) {
    let date = getDateWithOffset(message)

    let result = date.toLocaleDateString() + '의 급식이야!\n\n'
    result += latestMeal.get(date)

    data.message['text'] = result
  } else if (message.includes('시간표')) {
    let date = getDateWithOffset(message)

    let result = date.toLocaleDateString() + '의 시간표야!\n\n'
    await Parser.getTodayTimeTable(2, 4, date).then(body => {
      result += body
    })

    data.message['text'] = result
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
