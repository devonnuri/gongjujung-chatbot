const request = require('request-promise')

export const RouteDirection = {
  START_END: 1,
  END_START: 2,
}

export const getBusInfo = async (busStopCode: string): Array<{ busName: string, lastStop: string, busInfo: string }> => {
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

export const searchBusStop = async (keyword: string): {} => {
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

export const searchBusRoute = async (busRoute: string, routeDirection: RouteDirection = RouteDirection.START_END): {} => {
  return request({
    method: 'POST',
    url: 'http://bis.gongju.go.kr/inq/searchBusRoute.do',
    form: {
      busRoute,
    },
  }).then(async (body: string) => {
    const data = JSON.parse(body).busRouteDetailList
    for (const route of data) {
      if (route.route_id === routeDirection) {
        return route
      }
    }
  }).then(async (route: string) => {
    return request({
      method: 'POST',
      url: 'http://bis.gongju.go.kr/inq/searchBusRealLocationDetail.do',
      form: {
        busRouteId: route,
      }
    })
  }).then(async (body) => {
    return JSON.parse(body).busRealLocList
  })
}
