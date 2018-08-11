'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recognize = exports.getType = exports.MessageType = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

var _MealParser = require('./parser/MealParser');

var _BusParser = require('./parser/BusParser');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('dotenv').config();

var TIMEZONE = process.env.TIMEZONE;

_momentTimezone2.default.locale('ko');

var keywordMap = {
  MEAL: [/급식/, /조식/, /아침/, /중식/, /석식/, /저녁/, /밥/],
  TIMETABLE: [/시간표/],
  BUS_BY_BUS: [/([0-9]{3})번\s*(기점|종점)?발?.*버스/],
  BUS_BY_STOP: [/버스/]
};

var koreanOffset = {
  '그끄제': -3,
  '그저께': -2,
  '그제': -2,
  '어제': -1,
  '오늘': 0,
  '모레': 2,
  '내일': 1,
  '글피': 3,
  '그글피': 4
};

var getOffset = function getOffset(message) {
  for (var key in koreanOffset) {
    if (message.includes(key)) {
      return koreanOffset[key];
    }
  }
  return null;
};

var getDateFromOffset = function getDateFromOffset(offset) {
  return (0, _momentTimezone2.default)().add(offset, 'day').tz(TIMEZONE);
};

var getDateFromMessage = function getDateFromMessage(message) {
  var offset = getOffset(message);
  if (offset !== null) {
    return getDateFromOffset(offset);
  }

  var match = message.match(/([1-2]?[0-9])월 ?([1-3]?[0-9])일/);

  // TODO: Recognize Like "다음주 목요일"

  // When the match isn't null
  if (match) {
    var _ref = [match[1] - 1, match[2]],
        month = _ref[0],
        day = _ref[1];

    return (0, _momentTimezone2.default)({ month: month, day: day }).tz(TIMEZONE);
  } else {
    // if nothing has matched, return today's date
    return (0, _momentTimezone2.default)().tz(TIMEZONE);
  }
};

var classifyMessage = function classifyMessage(message, map) {
  for (var key in map) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = map[key][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var regex = _step.value;

        var _match = message.match(regex);
        if (_match) {
          return { type: key, removedMsg: message.replace(regex, ''), match: _match };
        }
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
  }
  return { type: null, removedMsg: null, match: null };
};

var MessageType = exports.MessageType = {
  MEAL: 'MEAL',
  TIMETABLE: 'TIMETABLE',
  BUS_BY_BUS: 'BUS_BY_BUS',
  BUS_BY_STOP: 'BUS_BY_STOP'
};

var getType = exports.getType = function getType(message) {
  return classifyMessage(message, keywordMap);
};

var recognize = exports.recognize = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(message) {
    var _getType, type, removedMsg, match, _classifyMessage, mealType, date, direction, busList, _ret;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _getType = getType(message), type = _getType.type, removedMsg = _getType.removedMsg, match = _getType.match;

            if (!(type === MessageType.MEAL)) {
              _context2.next = 7;
              break;
            }

            mealType = classifyMessage(message, (_classifyMessage = {}, _defineProperty(_classifyMessage, _MealParser.MealType.BREAKFAST, ['조식', '아침']), _defineProperty(_classifyMessage, _MealParser.MealType.LUNCH, ['점심', '중식']), _defineProperty(_classifyMessage, _MealParser.MealType.DINNER, ['저녁', '석식']), _classifyMessage)).type || _MealParser.MealType.LUNCH;
            date = getDateFromMessage(removedMsg);
            return _context2.abrupt('return', {
              type: type,
              mealType: mealType,
              mealTypeKorean: ['조식', '중식', '석식'][mealType],
              date: date
            });

          case 7:
            if (!(type === MessageType.BUS_BY_BUS)) {
              _context2.next = 15;
              break;
            }

            direction = match[2] === '종점' ? _BusParser.RouteDirection.END_START : _BusParser.RouteDirection.START_END;
            _context2.next = 11;
            return (0, _BusParser.searchBus)(match[1], direction);

          case 11:
            busList = _context2.sent;
            return _context2.abrupt('return', {
              type: type,
              busList: busList,
              direction: direction,
              directionKorean: ['기점발', '종점발'][direction - 1],
              input: { bus: match[1], direction: match[2] }
            });

          case 15:
            if (!(type === MessageType.BUS_BY_STOP)) {
              _context2.next = 20;
              break;
            }

            return _context2.delegateYield( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
              var busStopList, keywords, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, keyword;

              return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      busStopList = [];
                      keywords = removedMsg.trim().split(' ');
                      _iteratorNormalCompletion2 = true;
                      _didIteratorError2 = false;
                      _iteratorError2 = undefined;
                      _context.prev = 5;
                      _iterator2 = keywords[Symbol.iterator]();

                    case 7:
                      if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                        _context.next = 16;
                        break;
                      }

                      keyword = _step2.value;

                      if (keyword) {
                        _context.next = 11;
                        break;
                      }

                      return _context.abrupt('continue', 13);

                    case 11:
                      _context.next = 13;
                      return (0, _BusParser.searchBusStop)(keyword).then(function (data) {
                        busStopList.push.apply(busStopList, _toConsumableArray(data));
                      });

                    case 13:
                      _iteratorNormalCompletion2 = true;
                      _context.next = 7;
                      break;

                    case 16:
                      _context.next = 22;
                      break;

                    case 18:
                      _context.prev = 18;
                      _context.t0 = _context['catch'](5);
                      _didIteratorError2 = true;
                      _iteratorError2 = _context.t0;

                    case 22:
                      _context.prev = 22;
                      _context.prev = 23;

                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                      }

                    case 25:
                      _context.prev = 25;

                      if (!_didIteratorError2) {
                        _context.next = 28;
                        break;
                      }

                      throw _iteratorError2;

                    case 28:
                      return _context.finish(25);

                    case 29:
                      return _context.finish(22);

                    case 30:
                      return _context.abrupt('return', {
                        v: { type: type, busStopList: busStopList, input: { busStop: keywords[0] } }
                      });

                    case 31:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _callee, undefined, [[5, 18, 22, 30], [23,, 25, 29]]);
            })(), 't0', 17);

          case 17:
            _ret = _context2.t0;

            if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
              _context2.next = 20;
              break;
            }

            return _context2.abrupt('return', _ret.v);

          case 20:
            return _context2.abrupt('return', { type: type });

          case 21:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function recognize(_x) {
    return _ref2.apply(this, arguments);
  };
}();