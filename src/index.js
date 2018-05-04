import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import moment from 'moment-timezone'

import { MealType, fetchMeal } from './parser/MealParser'
import { getBusInfo } from './parser/BusParser'

import { MessageType, recognize } from './Recognizer'

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

const loadMeal = async (): void => {
  for (let i = -4; i <= 4; i++) {
    let date = moment().add(i, 'days').tz(TIMEZONE)
    let meal = []

    fetchMeal(date, MealType.LUNCH).then(body => {
      meal[MealType.LUNCH] = body
    }).then(() => fetchMeal(date, MealType.DINNER).then(body => {
      meal[MealType.DINNER] = body
    }))

    latestMeal[date] = meal
  }
  console.log(`Meal has preloaded. (#${++preloadedCount})`)
}

const getMeal = async (date: moment, mealType: MealType = MealType.LUNCH): string => {
  for (let key in latestMeal) {
    if (date.isSame(key, 'day')) {
      return latestMeal[key][mealType]
    }
  }

  return fetchMeal(date, mealType).then(body => {
    return body
  })
}

const formatBusInfo = async (busStopId: string, busStopName: string): string => {
  const bus = await getBusInfo(busStopId)
  let result = ''

  result += `현재 "${busStopName}" 정류장의 버스 정보입니다.\n`
  bus.forEach(({busName, lastStop, busInfo}) => {
    result += `${busName}번: ${lastStop}: ${busInfo}\n`
  })
  result += '\n'

  return result
}

router.get('/', (ctx, next) => {
  if (process.env.flag) {
    ctx.body = `<h1>You have the wrong number lul :(</h1><!--But Here is a flag!! FLAG{${process.env.flag}}-->`
  } else {
    ctx.body = `<h1>Ring..Ring..</h1>`
  }
})

router.get('/keyboard', (ctx, next) => {
  let data = {
    'type': 'text',
  }

  ctx.body = data
})

router.post('/message', async (ctx, next) => {
  let param: string = ctx.request.body
  let message: string
  if (LIVESERVER) {
    message = JSON.parse(param[0])['content']
  } else {
    message = param.content
  }

  let data = {
    message: {}
  }

  if (!message) {
    console.log(param)
    return
  }

  const recognized: { type: string, input: ?{} } = await recognize(message)

  if (recognized.type === MessageType.MEAL) {
    const meal = await getMeal(recognized.date, recognized.mealType)
    if (meal) {
      data.message['text'] = `${recognized.date.format('LL')}의 ${recognized.mealTypeKorean}이야!\n\n${meal}`
    } else {
      data.message['text'] = `안타깝게도 ${recognized.date.format('LL')}에는 ${recognized.mealTypeKorean}이 없어 ㅠㅠ`
    }
  } else if (recognized.type === MessageType.TIMETABLE) {
    data.message['text'] = '현재 시간표는 지원하지 않습니다. 나중에 지원토록 만들겠습니다 :)'
  } else if (recognized.type === MessageType.BUS_BY_BUS) {
    const busList = recognized.busList

    if (recognized.busList.length < 1) {
      data.message['text'] = `${recognized.input.bus}번 버스가 검색되지 않았습니다.`
    } else {
      let result = `${busList.length}개의 ${recognized.input.bus}번(${recognized.directionKorean}) 버스가 검색되었습니다.\n`
      for (const bus of busList) {
        result += bus.stop_name + '\n'
      }
      data.message['text'] = result.trim()
    }
  } else if (recognized.type === MessageType.BUS_BY_STOP) {
    if (recognized.busStopList.length < 1 && recognized.input.busStop) {
      data.message['text'] = `"${recognized.input.busStop}" 정류장이 검색되지 않았습니다.`
    } else {
      const busStopList = recognized.busStopList
      let result = ''

      if (busStopList.length > 0) {
        result = `${busStopList.length}개의 검색결과가 발견되었습니다. (최대 4개까지 표시)\n\n`
        for (const busStop of busStopList.slice(0, 4)) {
          result += await formatBusInfo(busStop.stop_id, busStop.stop_name)
        }
      } else {
        result = await formatBusInfo('286014002', '공주중학교(산성시장방면)')
      }

      data.message['text'] = result.trim()
    }
  } else {
    data.message['text'] = '뭐라는지 모르겠어! ><'
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
