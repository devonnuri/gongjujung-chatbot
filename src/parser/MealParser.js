// @flow

import cheerio from 'cheerio'
import request from 'request-promise'
import moment from 'moment-timezone'

export const MealType = {
  BREAKFAST: 0,
  LUNCH: 1,
  DINNER: 2,
}

export const fetchMeal = async (date: moment, mealType: number = module.exports.MealType.LUNCH) => {
  return request({
    method: 'GET',
    url: 'http://stu.cne.go.kr/sts_sci_md01_001.do',
    qs: {
      schulCode: 'N100000281',
      schulCrseScCode: '3',
      schMmealScCode: mealType + 1,
      schYmd: date.format('YYYYMMDD'),
    },
  }).then(body => {
    const $ = cheerio.load(body, { decodeEntities: false })
    return $('tbody tr:nth-child(2) td')
      .eq(date.day()).html()
      .replace(/<br\/?>/gi, '\n')
      .replace(/<[a-zA-Z]+\/?>/gi, '') // Remove Tag Except br Tag
      .replace(/([0-9]+\.)+/gi, '') // Remove Allergy Info
      .trim()
  }).catch(() => {})
}
