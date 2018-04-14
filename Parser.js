const cheerio = require('cheerio')
const request = require('request-promise')

const getDate = now => {
  return now.getFullYear() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0')
}

const getTimeTable = async (grade, room) => {
  /*
   * Payload:
   * 1. Get temporary request url in /st page (look like _h123345)
   * 2. Using (1), Get JSON Response
   * 3. Parse (2) into object
   */

  return request({
    method: 'GET',
    url: 'http://112.186.146.96:4080/st#',
  }).then(body => {
    // temprorary request url
    let url = body.match(/window\.localStorage;.+var [A-z0-9ㄱ-ㅎ가-힣$_]+\s*=\s*'([\w_-]+)'/)[1]

    return request({
      method: 'GET',
      url: `http://112.186.146.96:4080/${url}?sc=41837&nal=1&s=0`
    }).then(body => {
      body = body.split('\n')[0]
      const data = JSON.parse(body)
      const weeklySchedule = data.학급시간표[grade][room]
      weeklySchedule.shift(1)

      for (let day = 0; day < 5; day++) {
        const schedule = weeklySchedule[day]
        for (let period = 0, len = schedule.length; period < len; period += 1) {
          const subject = schedule[period]
          if (subject > 100) {
            weeklySchedule[day][period] = {
              subject: data['긴과목명'][subject % 100] || null,
              subjectAlias: data['과목명'][subject % 100] || null,
              teacher: data['성명'][Math.floor(subject / 100)] || null
            }
          } else {
            weeklySchedule[day][period] = null
          }
        }

        weeklySchedule[day].shift()
      }

      weeklySchedule.pop()

      return weeklySchedule
    })
  })
}

module.exports.test = async () => {
  return new Promise((resolve, reject) => {
    process.stdout.write('Testing School Meal... ')
    resolve()
  }).then(() => request({
    method: 'GET',
    url: 'http://stu.cne.go.kr/sts_sci_md01_001.do',
    resolveWithFullResponse: true,
  }).then(response => {
    if (response.statusCode === 200) {
      process.stdout.write('Succeed.\n')
    } else {
      process.stdout.write('Failed. (Status Code "' + response.statusCode + '")\n')
    }
  }).catch(error => {
    process.stdout.write('Failed. (' + error + ')\n')
  })).then(() => {
    process.stdout.write('Testing Comcigan(Getting Time Table)... ')
  }).then(() => getTimeTable(1, 1)).then(() => {
    process.stdout.write('Succeed.\n')
  }).catch(error => {
    process.stdout.write('Failed. (' + error + ')\n')
  })
}

module.exports.MealType = {
  BREAKFAST: 1,
  LUNCH: 2,
  DINNER: 3,
}

module.exports.getMeal = async (date, mealType = this.MealType.LUNCH) => {
  return request({
    method: 'GET',
    url: 'http://stu.cne.go.kr/sts_sci_md01_001.do',
    qs: {
      schulCode: 'N100000281',
      schulCrseScCode: '3',
      schMmealScCode: mealType,
      schYmd: getDate(date),
    },
  }).then(body => {
    const $ = cheerio.load(body, { decodeEntities: false })
    return $('tbody tr:nth-child(2) td')
      .eq(date.getDay()).html()
      .replace(/<br\/?>/gi, '\n')
      .replace(/<[a-zA-Z]+\/?>/gi, '') // Remove Tag Except br Tag
      .replace(/([0-9]+\.)+/gi, '') // Remove Allergy Info
      .trim()
  })
}

module.exports.getTodayTimeTable = async (grade, room, day) => {
  const schedule = await getTimeTable(grade, room)

  if (day.getDay() >= 1 && day.getDay() <= 5) {
    let result = ''
    for (let [index, subject] of schedule[day.getDay() - 1].entries()) {
      if (!subject) continue

      result += `${index + 1}교시: ${subject.subject}(${subject.teacher})\n`
    }
    return result
  } else {
    return null
  }
}
