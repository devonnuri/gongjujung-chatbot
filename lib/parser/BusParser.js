'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var request = require('request-promise');

var RouteDirection = exports.RouteDirection = {
  START_END: '1',
  END_START: '2'
};

var getBusInfo = exports.getBusInfo = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(busStopCode) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', request({
              method: 'POST',
              url: 'http://bis.gongju.go.kr/inq/searchBusStopRoute.do',
              form: {
                busStopId: busStopCode
              }
            }).then(function (body) {
              var json = JSON.parse(body);
              var result = [];
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = json.busStopRouteList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var bus = _step.value;

                  if (bus.route_name === '') continue;
                  if (bus.provide_type === '정보없음') continue;

                  var _busName = bus.route_name;
                  var _lastStop = bus.last_stop_name;
                  var _busInfo = {
                    1: bus.provide_type + '\uC5D0 \uCD9C\uBC1C',
                    2: bus.provide_type + ' \uBD84 \uD6C4 \uB3C4\uCC29',
                    3: '\uC7A0\uC2DC \uD6C4 \uB3C4\uCC29'
                  }[bus.provide_code];

                  result.push({ busName: _busName, lastStop: _lastStop, busInfo: _busInfo });
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }

              return result;
            }).catch(function () {}));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getBusInfo(_x) {
    return _ref.apply(this, arguments);
  };
}();

var searchBusStop = exports.searchBusStop = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(keyword) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt('return', request({
              method: 'POST',
              url: 'http://bis.gongju.go.kr/inq/searchBusStop.do',
              form: {
                busStop: keyword
              }
            }).then(function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(body) {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        return _context2.abrupt('return', JSON.parse(body).busStopList);

                      case 1:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined);
              }));

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function searchBusStop(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var searchBus = exports.searchBus = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(busRoute) {
    var routeDirection = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : RouteDirection.START_END;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            return _context5.abrupt('return', request({
              method: 'POST',
              url: 'http://bis.gongju.go.kr/inq/searchBusRoute.do',
              form: {
                busRoute: busRoute
              }
            }).then(function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(body) {
                var data, result, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, route, json;

                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        data = JSON.parse(body).busRouteDetailList;
                        result = [];
                        _iteratorNormalCompletion2 = true;
                        _didIteratorError2 = false;
                        _iteratorError2 = undefined;
                        _context4.prev = 5;
                        _iterator2 = data[Symbol.iterator]();

                      case 7:
                        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                          _context4.next = 16;
                          break;
                        }

                        route = _step2.value;
                        _context4.next = 11;
                        return request({
                          method: 'POST',
                          url: 'http://bis.gongju.go.kr/inq/searchBusRealLocationDetail.do',
                          form: {
                            busRouteId: route.route_id
                          }
                        });

                      case 11:
                        json = _context4.sent;

                        result.push.apply(result, _toConsumableArray(JSON.parse(json).busRealLocList.filter(function (bus) {
                          return bus.route_direction === routeDirection;
                        })));

                      case 13:
                        _iteratorNormalCompletion2 = true;
                        _context4.next = 7;
                        break;

                      case 16:
                        _context4.next = 22;
                        break;

                      case 18:
                        _context4.prev = 18;
                        _context4.t0 = _context4['catch'](5);
                        _didIteratorError2 = true;
                        _iteratorError2 = _context4.t0;

                      case 22:
                        _context4.prev = 22;
                        _context4.prev = 23;

                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                          _iterator2.return();
                        }

                      case 25:
                        _context4.prev = 25;

                        if (!_didIteratorError2) {
                          _context4.next = 28;
                          break;
                        }

                        throw _iteratorError2;

                      case 28:
                        return _context4.finish(25);

                      case 29:
                        return _context4.finish(22);

                      case 30:
                        return _context4.abrupt('return', result);

                      case 31:
                      case 'end':
                        return _context4.stop();
                    }
                  }
                }, _callee4, undefined, [[5, 18, 22, 30], [23,, 25, 29]]);
              }));

              return function (_x6) {
                return _ref5.apply(this, arguments);
              };
            }()));

          case 1:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function searchBus(_x5) {
    return _ref4.apply(this, arguments);
  };
}();