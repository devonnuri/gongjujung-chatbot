const cheerio = require('cheerio')
const request = require('request-promise')

const getDate = now => {
  return now.getFullYear() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0')
}

module.exports.getMeal = async date => {
  return request({
    method: 'GET',
    url: 'http://stu.cne.go.kr/sts_sci_md01_001.do',
    qs: {
      schulCode: 'N100000281',
      schulCrseScCode: '3',
      // TODO: 석식 추가
      schYmd: getDate(date),
    }
  }).then(html => {
    const $ = cheerio.load(html, { decodeEntities: false })
    return $('tbody tr:nth-child(2) td').eq(date.getDay()).html().replace(/<br\\?>/gi, '\n')
    // TODO: 없으면 없다고 말해줘야함
  })
}
