const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const Parser = require('./Parser')
const moment = require('moment-timezone')

const app = new Koa()
const router = new Router()

const PORT = process.env.PORT || 8080
const TIMEZONE = 'Asia/Seoul'

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

let latestMeal = {}

app.use(bodyParser())

moment.locale('ko')

const getDateFromOffset = offset => {
  return moment().add(offset, 'day').tz(TIMEZONE)
}

const getOffset = message => {
  for (let key in KOREAN_DATE) {
    if (message.includes(key)) {
      return KOREAN_DATE[key]
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
    
    //TODO: Recognize Like "다음주 목요일"
    
    // When the match isn't null
    if (match) {
      let [month, day] = [match[1] - 1, match[2]]
      return moment({month, day}).tz(TIMEZONE)
    } else { // if nothing has matched, return today's date
      return moment().tz(TIMEZONE)
    }
  }
}

const loadMeal = () => {
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
  console.log('Meal has preloaded.')
}

const getMeal = (date, mealType = Parser.MealType.LUNCH) => {
  for (let key in latestMeal) {
    if (date.isSame(key, 'day')) {
      return latestMeal[key][mealType]
    }
  }
  
  return Parser.getMeal(date, mealType).then(body => {
    return body
  });
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

  if (message.includes('급식') || message.includes('중식') || message.includes('석식')) {
    let date = getDateFromMessage(message)
    let mealType
    
    if(message.includes('석식')) {
      mealType = Parser.MealType.DINNER
    } else {
      mealType = Parser.MealType.LUNCH
    }
    
    let result = getMeal(date, mealType)
    let mealTypeStr = ['조식', '중식', '석식'][mealType]
    if (result) {
      data.message['text'] = `${date.format('LL')}의 ${mealTypeStr}이야!\n\n${result}`
    } else {
      data.message['text'] = `안타깝게도 ${date.format('LL')}에는 ${mealTypeStr}이 없어 ㅠ`
    }
  } else if (message.includes('시간표')) {
    let date = getDateFromMessage(message)
    let match = message.match(/([1-3])학년 ?([1-9])반/)
    let [grade, room] = [2, 4]

    if (match) {
      [grade, room] = [match[1], match[2]]
    }

    let result = ""
    await Parser.getTodayTimeTable(grade, room, date).then(body => {
      if (body) {
        result += `${grade}학년 ${room}반의 ${date.format('LL')}의 시간표야!\n\n`
        result += body
      } else {
        // Is it today?
        if (date.isSame(moment(), 'day')) {
          result += '안타깝게도 오늘 수업은 없어.. 오늘은 놀아보자구!'
        } else {
          result += date.format('LL') + '에는 수업이 없어!'
        }
      }
    })

    data.message['text'] = result
  } else if (message.includes('도움')) {
    let result = `내가 무엇을 할수 있는지 알려줄께!

"오늘 급식 알려줘!": 오늘의 급식을 알려줍니다.
"내일 모레 급식 알려줘!": 내일 모레의 급식을 알려줍니다.
"4월 12일 급식 알려줘!": 4월 12일 급식을 알려줍니다.

"2학년 4반 내일 시간표 아냐?": 2학년 4반의 내일 시간표를 알려줍니다.
"1학년 2반 글피 시간표 아냐?": 1학년 2반의 글피 시간표를 알려줍니다.`

    data.message['text'] = result
  } else {
    data.message['text'] = '뭐라는지 모르겠어 ㅠㅠ\n기능 제안이나 버그 제보는 항상 받고 있으니 언제나 알려달라고!'
  }

  ctx.body = data
})

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`)
  console.log(`I am READY!!`)

  Parser.test().then(() => {
    loadMeal()
  })

  // Prevent Sleeping & Fast Loading
  setInterval(() => loadMeal(), 300000)
})

app
  .use(router.routes())
  .use(router.allowedMethods())
