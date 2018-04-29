const request = require('request-promise')

export const BusStop = {
  GONGJU_MS: '286014002',
}

export const getBusInfo = async (busStopCode) => {
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
      if (bus.route_name === '') continue
      if (bus.provide_type === '정보없음') continue

      const busName = bus.route_name
      const lastStop = bus.last_stop_name
      const busInfo = {
        1: `${bus.provide_type}에 출발`,
        2: `${bus.provide_type} 분 후 도착`,
        3: `잠시 후 도착`,
      }[bus.provide_code]

      result.push({ busName, lastStop, busInfo })
    }
    return result
  }).catch(() => {})
}

export const searchBusStop = async (keyword) => {
  return request({
    method: 'POST',
    url: 'http://bis.gongju.go.kr/inq/searchBusStop.do',
    form: {
      busStop: keyword,
    },
  }).then(async (body) => {
    return JSON.parse(body).busStopList
  })
}
