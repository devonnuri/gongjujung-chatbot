import moment from 'moment-timezone'

import { MealType } from './parser/MealParser'
import { searchBus, searchBusStop, RouteDirection } from './parser/BusParser'

require('dotenv').config()

const TIMEZONE = process.env.TIMEZONE

moment.locale('ko')

const keywordMap = {
  MEAL: [/급식/, /조식/, /아침/, /중식/, /석식/, /저녁/, /밥/],
  TIMETABLE: [/시간표/],
  BUS_BY_BUS: [/([0-9]{3})번\s*(기점|종점)?발?.*버스/],
  BUS_BY_STOP: [/버스/],
}

const koreanOffset = {
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

const getOffset = (message: string): ?number => {
  for (let key in koreanOffset) {
    if (message.includes(key)) {
      return koreanOffset[key]
    }
  }
  return null
}

const getDateFromOffset = (offset: number): moment => {
  return moment().add(offset, 'day').tz(TIMEZONE)
}

const getDateFromMessage = (message: string): moment => {
  let offset: number = getOffset(message)
  if (offset !== null) {
    return getDateFromOffset(offset)
  }

  let match = message.match(/([1-2]?[0-9])월 ?([1-3]?[0-9])일/)

  // TODO: Recognize Like "다음주 목요일"

  // When the match isn't null
  if (match) {
    let [month: number, day: number] = [match[1] - 1, match[2]]
    return moment({month, day}).tz(TIMEZONE)
  } else { // if nothing has matched, return today's date
    return moment().tz(TIMEZONE)
  }
}

const classifyMessage = (message: string, map: {}): {type: ?string, removedMsg: ?string, match: ?Array} => {
  for (const key in map) {
    for (const regex of map[key]) {
      const match = message.match(regex)
      if (match) {
        return { type: key, removedMsg: message.replace(regex, ''), match }
      }
    }
  }
  return { type: null, removedMsg: null, match: null }
}

export const MessageType = {
  MEAL: 'MEAL',
  TIMETABLE: 'TIMETABLE',
  BUS_BY_BUS: 'BUS_BY_BUS',
  BUS_BY_STOP: 'BUS_BY_STOP',
}

export const getType = (message: string): MessageType => {
  return classifyMessage(message, keywordMap)
}

export const recognize = async (message: string): { type: MessageType } => {
  const { type, removedMsg, match } = getType(message)

  if (type === MessageType.MEAL) {
    const mealType: MealType = classifyMessage(message, {
      [MealType.BREAKFAST]: ['조식', '아침'],
      [MealType.LUNCH]: ['점심', '중식'],
      [MealType.DINNER]: ['저녁', '석식'],
    }).type || MealType.LUNCH

    const date: moment = getDateFromMessage(removedMsg)

    return {
      type,
      mealType,
      mealTypeKorean: ['조식', '중식', '석식'][mealType],
      date,
    }
  } else if (type === MessageType.BUS_BY_BUS) {
    const direction = match[2] === '종점' ? RouteDirection.END_START : RouteDirection.START_END
    const busList = await searchBus(match[1], direction)
    return { type, busList, input: { bus: match[1], direction: match[2] } }
  } else if (type === MessageType.BUS_BY_STOP) {
    let busStopList = []
    const keywords = removedMsg.trim().split(' ')
    for (const keyword of keywords) {
      if (!keyword) continue
      await searchBusStop(keyword).then((data) => {
        busStopList.push(...data)
      })
    }
    return { type, busStopList, input: { busStop: keywords[0] } }
  }
  return { type }
}
