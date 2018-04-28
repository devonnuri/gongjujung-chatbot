const moment = require('moment-timezone')

const Meal = require('./parser/MealParser')
const Bus = require('./parser/BusParser')

require('dotenv').config()

const TIMEZONE = process.env.TIMEZONE

moment.locale('ko')

const keywordMap = {
  MEAL: ['급식', '조식', '아침', '중식', '석식', '저녁', '밥'],
  TIMETABLE: ['시간표'],
  BUS_BY_STOP: ['버스'],
  BUS_BY_BUS: ['번 버스', '번버스']
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

const getOffset = message => {
  for (let key in koreanOffset) {
    if (message.includes(key)) {
      return koreanOffset[key]
    }
  }

  return null
}

const getDateFromOffset = offset => {
  return moment().add(offset, 'day').tz(TIMEZONE)
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

const classifyMessage = (message, map) => {
  for (const key in map) {
    for (const keyword of map[key]) {
      if (message.includes(keyword)) {
        return { type: key, removedMsg: message.replace(keyword, '') }
      }
    }
  }
  return { type: null, removedMsg: null }
}

module.exports.Type = {
  MEAL: 'MEAL',
  TIMETABLE: 'TIMETABLE',
  BUS_BY_STOP: 'BUS_BY_STOP',
  BUS_BY_BUS: 'BUS_BY_BUS',
}

/**
 * Return type of message
 * @param {string} message
 */
module.exports.getType = message => {
  return classifyMessage(message, keywordMap)
}

/**
 * Return recognized type and information of message
 * @param {string} message
 */
module.exports.recognize = async message => {
  const { type, removedMsg } = this.getType(message)

  if (type === this.Type.MEAL) {
    const mealType = classifyMessage(message, {
      0: ['조식', '아침'],
      1: ['점심', '중식'],
      2: ['저녁', '석식'],
    }).type || Meal.MealType.LUNCH

    const date = getDateFromMessage(removedMsg)

    return {
      type,
      mealType,
      mealTypeKorean: ['조식', '중식', '석식'][mealType],
      date,
    }
  } else if (type === this.Type.BUS_BY_STOP) {
    let busStopList = []
    const keywords = removedMsg.trim().split(' ')
    for (const keyword of keywords) {
      if (!keyword) continue
      await Bus.searchBusStop(keyword).then(async (data) => {
        busStopList.push(...data)
      })
    }
    return { type, busStopList, mayBusStop: keywords[0] }
  }
  return { type }
}
