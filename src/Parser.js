const cheerio = require('cheerio')
const request = require('request-promise')

module.exports.MealType = {
  BREAKFAST: 0,
  LUNCH: 1,
  DINNER: 2,
}

module.exports.getMeal = async (date, mealType = this.MealType.LUNCH) => {
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
  })
}

module.exports.BusStop = {
  GONGJU_MS: 286014002,
}

module.exports.getBusInfo = async (busStopCode) => {
  // Gongju Middle School - 286014002
  return request({
    method: 'POST',
    url: 'http://bis.gongju.go.kr/inq/searchBusStopRoute.do',
    form: {
      busStopId: busStopCode,
    },
  }).then(body => {
    const json = JSON.parse(body)
    let result = []
    for (let bus of json.busStopRouteList) {
      if(bus.route_name === '') continue;
      
      const busName = bus.route_name
      const lastStop = bus.last_stop_name
      const busInfo = {
        1: `${bus.provide_type}에 출발`,
        2: `${bus.provide_type} 분 후 도착`,
        3: `잠시 후 도착`,
      }[bus.provide_code] || '정보 없음'
      result.push({ busName, lastStop, busInfo })
    }
    return result
  })
}