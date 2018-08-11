'use strict';

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * Get Monthly Schedule with year and month from date
 * @param {moment} date
 */
module.exports.getMonthlySchedule = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(date) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', (0, _requestPromise2.default)({
              method: 'GET',
              url: 'http://stu.cne.go.kr/sts_sci_sf01_001.do',
              qs: {
                schulCode: 'N100000281',
                schulCrseScCode: '3',
                ay: date.year(),
                mm: date.month()
              }
            }).then(function (body) {
              var $ = _cheerio2.default.load(body, { decodeEntities: false });
              return $('tbody tr:nth-child(2) td').eq(date.day()).html().replace(/<br\/?>/gi, '\n').replace(/<[a-zA-Z]+\/?>/gi, '') // Remove Tag Except br Tag
              .replace(/([0-9]+\.)+/gi, '') // Remove Allergy Info
              .trim();
            }).catch(function () {}));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();