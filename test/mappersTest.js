const mappers = require('../src/mappers')

describe('static mapper', () => {
  it('maps a static value to another', () => {
    const params = {
      mapping: {
        'this': 'that'
      }
    }
    const mapper = mappers.static(params)
    expect(mapper('this'), 'to equal', 'that')
  })
})

describe('regexMapper', () => {
  it('maps a regex value to another', () => {
    const params = {
      expression: '^The door is currently (OPEN|CLOSED), yo!$',
      captureGroup: 1
    }
    const mapper = mappers.regex(params)
    expect(mapper('The door is currently OPEN, yo!'), 'to equal', 'OPEN')
  })
})

describe('xpathMapper', () => {
  it('maps an xpath value to another', () => {
    const params = {
      expression: "//partition[3]/text()",
      index: 0
    }
    const xml = `
<partition>one</partition>
<partition>two</partition>
<partition>OPEN</partition>`

    const mapper = mappers.xpath(params)
    expect(mapper(xml), 'to equal', 'OPEN')
  })
})
