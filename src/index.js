const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const moment = require('moment-timezone')

const Parser = require('./Parser')
const Recognizer = require('./Recognizer')

const app = new Koa()
const router = new Router()

require('dotenv').config()

const PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080
const IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP || 8080
const TIMEZONE = process.env.TIMEZONE
const LIVESERVER = !require('fs').existsSync('.devserver')

let preloadedCount = 0

let latestMeal = {}

app.use(bodyParser())

const loadMeal = async () => {
  for (let i = -4; i <= 4; i++) {
    let date = moment().add(i, 'day').tz(TIMEZONE)
    let meal = []

    Parser.getMeal(date, Parser.MealType.LUNCH).then(body => {
      meal[Parser.MealType.LUNCH] = body
    }).then(() => Parser.getMeal(date, Parser.MealType.DINNER).then(body => {
      meal[Parser.MealType.DINNER] = body
    }))

    latestMeal[date] = meal
  }
  console.log(`Meal has preloaded. (#${++preloadedCount})`)
}

const getMeal = (date, mealType = Parser.MealType.LUNCH) => {
  for (let key in latestMeal) {
    if (date.isSame(key, 'day')) {
      return latestMeal[key][mealType]
    }
  }

  return Parser.getMeal(date, mealType).then(body => {
    return body
  })
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
  let message
  if (LIVESERVER) {
    message = JSON.parse(param[0])['content']
  } else {
    message = param.content
  }

  let data = {
    message: {},
  }

  if (!message) {
    console.log(param)
    return
  }

  const recognized = await Recognizer.recognize(message)

  if (recognized.type === Recognizer.Type.MEAL) {
    if (getMeal(recognized.date)) {
      data.message['text'] = `${recognized.date.format('LL')}의 ${recognized.mealTypeKorean}이야!\n\n`
      data.message['text'] += getMeal(recognized.date)
    } else {
      data.message['text'] = `안타깝게도 ${recognized.date.format('LL')}에는 ${recognized.mealTypeKorean}이 없어 ㅠㅠ`
    }
  } else if (recognized.type === Recognizer.Type.TIMETABLE) {
    data.message['text'] = '현재 시간표는 지원하지 않습니다. 나중에 지원토록 만들겠습니다 :)'
  } else if (recognized.type === Recognizer.Type.BUS_BY_STOP) {
    if (recognized.busStopList.length < 1) {
      data.message['text'] = `"${recognized.mayBusStop}" 정류장이 검색되지 않았습니다.`
    } else {
      const busStop = recognized.busStopList[0]
      const bus = await Parser.getBusInfo(busStop.stop_id)
      let result = ''

      result += `현재 "${busStop.stop_name}" 정류장의 버스 정보입니다.\n\n`
      bus.forEach(({busName, lastStop, busInfo}) => {
        result += `${busName}번: ${lastStop}\n${busInfo}\n\n`
      })

      data.message['text'] = result
    }
  }

  ctx.body = data
})

app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Listening to port ${PORT}`)
  loadMeal().then(() => {
    console.log('NOW LOADING!!')
  })
  setInterval(() => loadMeal(), 300000)
})

app
  .use(router.routes())
  .use(router.allowedMethods())
