// @flow

import cheerio from 'cheerio'
import request from 'request-promise'
import moment from 'moment-timezone'

/**
 * Get Monthly Schedule with year and month from date
 * @param {moment} date
 */
module.exports.getMonthlySchedule = async (date: moment) => {
  return request({
    method: 'GET',
    url: 'http://stu.cne.go.kr/sts_sci_sf01_001.do',
    qs: {
      schulCode: 'N100000281',
      schulCrseScCode: '3',
      ay: date.year(),
      mm: date.month()
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
