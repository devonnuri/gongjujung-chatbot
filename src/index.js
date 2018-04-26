const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const moment = require('moment-timezone')

const Parser = require('./Parser')

const app = new Koa()
const router = new Router()

const PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080
const IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP || 8080

const TIMEZONE = 'Asia/Seoul'

let preloadedCount = 0

const koreanDate = {
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

let latestMeal = {}

app.use(bodyParser())

moment.locale('ko')

const getDateFromOffset = offset => {
  return moment().add(offset, 'day').tz(TIMEZONE)
}

const getOffset = message => {
  for (let key in koreanDate) {
    if (message.includes(key)) {
      return koreanDate[key]
    }
  }

  return null
}

const getDateFromMessage = message => {
  let offset = getOffset(message)
  if (offset !== null) {
    return getDateFromOffset(offset)
  } else {
    let match = message.match(/([1-2]?[0-9])월 ?([1-3]?[0-9])일/)

    // TODO: Recognize Like "다음주 목요일"

    // When the match isn't null
    if (match) {
      let [month, day] = [match[1] - 1, match[2]]
      return moment({month, day}).tz(TIMEZONE)
    } else { // if nothing has matched, return today's date
      return moment().tz(TIMEZONE)
    }
  }
}

const loadMeal = async () => {
  for (let i = -4; i <= 4; i++) {
    let date = getDateFromOffset(i)
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
  let message = JSON.parse(param[0])['content']

  let data = {
    message: {},
  }

  if (message === undefined) {
    console.log(param)
    return
  }

  if (message.includes('급식') || message.includes('중식') || message.includes('석식')) {
    let date = getDateFromMessage(message)
    let mealType = message.includes('석식') ? Parser.MealType.DINNER : Parser.MealType.LUNCH

    let result = getMeal(date, mealType)
    let mealTypeStr = ['조식', '중식', '석식'][mealType]
    if (result) {
      data.message['text'] = `${date.format('LL')}의 ${mealTypeStr}이야!\n\n${result}`
    } else {
      data.message['text'] = `안타깝게도 ${date.format('LL')}에는 ${mealTypeStr}이 없어 ㅠ`
    }
  } else if (message.includes('시간표')) {
    data.message['text'] = '현재 시간표는 지원하지 않습니다. 나중에 지원토록 만들겠습니다 :)'
  } else if (message.includes('버스')) {
    let bus = await Parser.getBusInfo(Parser.BusStop.GONGJU_MS)
    let result = ''

    result += `현재 "공주중학교" 정류장의 버스 정보입니다.\n\n`
    bus.forEach(((busName, lastStop, busInfo) => {
      result += `${busName}번: ${lastStop}\n${busInfo}\n\n`
    })

    data.message['text'] = result.trim()
  } else if (message.includes('도움')) {
    let result = `내가 무엇을 할수 있는지 알려줄께!

"오늘 급식 알려줘!": 오늘의 급식을 알려줍니다.
"내일 모레 급식 알려줘!": 내일 모레의 급식을 알려줍니다.
"4월 12일 급식 알려줘!": 4월 12일 급식을 알려줍니다.
`
    data.message['text'] = result
  } else {
    data.message['text'] = '뭐라는지 모르겠어 ㅠㅠ\n기능 제안이나 버그 제보는 항상 받고 있으니 언제나 알려달라고!'
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
