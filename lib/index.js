'use strict';

require('babel-polyfill');

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _koaBodyparser = require('koa-bodyparser');

var _koaBodyparser2 = _interopRequireDefault(_koaBodyparser);

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

var _MealParser = require('./parser/MealParser');

var _BusParser = require('./parser/BusParser');

var _Recognizer = require('./Recognizer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var app = new _koa2.default();
var router = new _koaRouter2.default();

require('dotenv').config();

var PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP || 8080;
var TIMEZONE = process.env.TIMEZONE;
var LIVESERVER = !require('fs').existsSync('.devserver');

var preloadedCount = 0;

var latestMeal = {};

app.use((0, _koaBodyparser2.default)());

var loadMeal = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var _loop, i;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _loop = function _loop(i) {
              var date = (0, _momentTimezone2.default)().add(i, 'days').tz(TIMEZONE);
              var meal = [];

              (0, _MealParser.fetchMeal)(date, _MealParser.MealType.LUNCH).then(function (body) {
                meal[_MealParser.MealType.LUNCH] = body;
              }).then(function () {
                return (0, _MealParser.fetchMeal)(date, _MealParser.MealType.DINNER).then(function (body) {
                  meal[_MealParser.MealType.DINNER] = body;
                });
              });

              latestMeal[date] = meal;
            };

            for (i = -4; i <= 4; i++) {
              _loop(i);
            }
            console.log('Meal has preloaded. (#' + ++preloadedCount + ')');

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function loadMeal() {
    return _ref.apply(this, arguments);
  };
}();

var getMeal = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(date) {
    var mealType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _MealParser.MealType.LUNCH;
    var key;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.t0 = regeneratorRuntime.keys(latestMeal);

          case 1:
            if ((_context2.t1 = _context2.t0()).done) {
              _context2.next = 7;
              break;
            }

            key = _context2.t1.value;

            if (!date.isSame(key, 'day')) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt('return', latestMeal[key][mealType]);

          case 5:
            _context2.next = 1;
            break;

          case 7:
            return _context2.abrupt('return', (0, _MealParser.fetchMeal)(date, mealType).then(function (body) {
              return body;
            }));

          case 8:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function getMeal(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var formatBusInfo = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(busStopId, busStopName) {
    var bus, result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _BusParser.getBusInfo)(busStopId);

          case 2:
            bus = _context3.sent;
            result = '';


            result += '\uD604\uC7AC "' + busStopName + '" \uC815\uB958\uC7A5\uC758 \uBC84\uC2A4 \uC815\uBCF4\uC785\uB2C8\uB2E4.\n';
            bus.forEach(function (_ref4) {
              var busName = _ref4.busName,
                  lastStop = _ref4.lastStop,
                  busInfo = _ref4.busInfo;

              result += busName + '\uBC88: ' + lastStop + ': ' + busInfo + '\n';
            });
            result += '\n';

            return _context3.abrupt('return', result);

          case 8:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function formatBusInfo(_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

router.get('/', function (ctx, next) {
  if (process.env.flag) {
    ctx.body = '<h1>You have the wrong number lul :(</h1><!--But Here is a flag!! FLAG{' + process.env.flag + '}-->';
  } else {
    ctx.body = '<h1>Ring..Ring..</h1>';
  }
});

router.get('/keyboard', function (ctx, next) {
  var data = {
    'type': 'text'
  };

  ctx.body = data;
});

router.post('/message', function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(ctx, next) {
    var param, message, data, recognized, _meal, busList, result, markers, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, bus, busStopList, _result, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, busStop;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            param = ctx.request.body;
            message = JSON.parse(param[0])['content'];
            data = {
              message: {}
            };

            if (message) {
              _context4.next = 6;
              break;
            }

            console.log(param);
            return _context4.abrupt('return');

          case 6:
            _context4.next = 8;
            return (0, _Recognizer.recognize)(message);

          case 8:
            recognized = _context4.sent;

            if (!(recognized.type === _Recognizer.MessageType.MEAL)) {
              _context4.next = 16;
              break;
            }

            _context4.next = 12;
            return getMeal(recognized.date, recognized.mealType);

          case 12:
            _meal = _context4.sent;

            if (_meal) {
              data.message['text'] = recognized.date.format('LL') + '\uC758 ' + recognized.mealTypeKorean + '\uC774\uC57C!\n\n' + _meal;
            } else {
              data.message['text'] = '\uC548\uD0C0\uAE5D\uAC8C\uB3C4 ' + recognized.date.format('LL') + '\uC5D0\uB294 ' + recognized.mealTypeKorean + '\uC774 \uC5C6\uC5B4 \u3160\u3160';
            }
            _context4.next = 96;
            break;

          case 16:
            if (!(recognized.type === _Recognizer.MessageType.TIMETABLE)) {
              _context4.next = 20;
              break;
            }

            data.message['text'] = '현재 시간표는 지원하지 않습니다. 나중에 지원토록 만들겠습니다 :)';
            _context4.next = 96;
            break;

          case 20:
            if (!(recognized.type === _Recognizer.MessageType.BUS_BY_BUS)) {
              _context4.next = 51;
              break;
            }

            busList = recognized.busList;

            if (!(recognized.busList.length < 1)) {
              _context4.next = 26;
              break;
            }

            data.message['text'] = recognized.input.bus + '\uBC88 \uBC84\uC2A4\uAC00 \uAC80\uC0C9\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.';
            _context4.next = 49;
            break;

          case 26:
            result = busList.length + '\uAC1C\uC758 ' + recognized.input.bus + '\uBC88(' + recognized.directionKorean + ') \uBC84\uC2A4\uAC00 \uAC80\uC0C9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n';
            markers = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context4.prev = 31;


            for (_iterator = busList[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              bus = _step.value;

              result += bus.stop_name + '\n';
              markers.push([bus.lat, bus.lng]);
            }

            _context4.next = 39;
            break;

          case 35:
            _context4.prev = 35;
            _context4.t0 = _context4['catch'](31);
            _didIteratorError = true;
            _iteratorError = _context4.t0;

          case 39:
            _context4.prev = 39;
            _context4.prev = 40;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 42:
            _context4.prev = 42;

            if (!_didIteratorError) {
              _context4.next = 45;
              break;
            }

            throw _iteratorError;

          case 45:
            return _context4.finish(42);

          case 46:
            return _context4.finish(39);

          case 47:
            data.message['text'] = result;

            data.message['photo'] = {
              url: 'http://maps.google.com/maps/api/staticmap?size=700x700&maptype=roadmap' + ('&markers=' + markers.map(function (arr) {
                return arr[0] + ',' + arr[1];
              }).join('&markers=')),
              width: 500,
              height: 500
            };

          case 49:
            _context4.next = 96;
            break;

          case 51:
            if (!(recognized.type === _Recognizer.MessageType.BUS_BY_STOP)) {
              _context4.next = 95;
              break;
            }

            if (!(recognized.busStopList.length < 1 && recognized.input.busStop)) {
              _context4.next = 56;
              break;
            }

            data.message['text'] = '"' + recognized.input.busStop + '" \uC815\uB958\uC7A5\uC774 \uAC80\uC0C9\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.';
            _context4.next = 93;
            break;

          case 56:
            busStopList = recognized.busStopList;
            _result = '';

            if (!(busStopList.length > 0)) {
              _context4.next = 89;
              break;
            }

            _result = busStopList.length + '\uAC1C\uC758 \uAC80\uC0C9\uACB0\uACFC\uAC00 \uBC1C\uACAC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. (\uCD5C\uB300 4\uAC1C\uAE4C\uC9C0 \uD45C\uC2DC)\n\n';
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context4.prev = 63;
            _iterator2 = busStopList.slice(0, 4)[Symbol.iterator]();

          case 65:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context4.next = 73;
              break;
            }

            busStop = _step2.value;
            _context4.next = 69;
            return formatBusInfo(busStop.stop_id, busStop.stop_name);

          case 69:
            _result += _context4.sent;

          case 70:
            _iteratorNormalCompletion2 = true;
            _context4.next = 65;
            break;

          case 73:
            _context4.next = 79;
            break;

          case 75:
            _context4.prev = 75;
            _context4.t1 = _context4['catch'](63);
            _didIteratorError2 = true;
            _iteratorError2 = _context4.t1;

          case 79:
            _context4.prev = 79;
            _context4.prev = 80;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 82:
            _context4.prev = 82;

            if (!_didIteratorError2) {
              _context4.next = 85;
              break;
            }

            throw _iteratorError2;

          case 85:
            return _context4.finish(82);

          case 86:
            return _context4.finish(79);

          case 87:
            _context4.next = 92;
            break;

          case 89:
            _context4.next = 91;
            return formatBusInfo('286014002', '공주중학교(산성시장방면)');

          case 91:
            _result = _context4.sent;

          case 92:

            data.message['text'] = _result;

          case 93:
            _context4.next = 96;
            break;

          case 95:
            data.message['text'] = '뭐라는지 모르겠어! ><';

          case 96:

            data.message['text'] = data.message['text'].trim();

            ctx.body = data;

          case 98:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[31, 35, 39, 47], [40,, 42, 46], [63, 75, 79, 87], [80,, 82, 86]]);
  }));

  return function (_x5, _x6) {
    return _ref5.apply(this, arguments);
  };
}());

app.listen(PORT, IP_ADDRESS, function () {
  console.log('Listening to port ' + PORT);
  loadMeal().then(function () {
    console.log('NOW LOADING!!');
  });
  setInterval(function () {
    return loadMeal();
  }, 300000);
});

app.use(router.routes()).use(router.allowedMethods());