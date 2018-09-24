const simple = require('simple-mock')
const createEntryAccessory = require('../src/EntryAccessory')

class MockGarageDoorOpener {
  getCharacteristic() {
    return this
  }
  on() {
    return this
  }
}

const mockHomebridge = {
  hap: {
    Service: {
      GarageDoorOpener: MockGarageDoorOpener,
    },
    Characteristic: {
      CurrentDoorState: {},
      TargetDoorState: {
        OPEN: 0,
        CLOSED: 1,
      }
    },
  }
}

const responses = {
  open: [null, {}, '0'],
  closed: [null, {}, '1'],
  empty: [null, {}],
  complex: [null, {}, `It's open`],
}

const log = () => {}

const config = {
  name: 'Gate',
  api: {
    getTargetState: {
      url: '/state'
    },
    getCurrentState: {
      url: '/state'
    },
    open: {
      url: '/open'
    },
    close: {
      url: '/closed'
    }
  },
}

describe('createEntryAccessory', () => {
  it('returns a EntryAccessory class', () => {
    const EntryAccessory = createEntryAccessory(mockHomebridge)
    expect(EntryAccessory, 'to be a function')
  })
})

describe('EntryAccessory', () => {
  const EntryAccessory = createEntryAccessory(mockHomebridge)

  it('returns current state of 0 when OPEN', (done) => {
    simple.mock(EntryAccessory.prototype, '_request')
      .callbackWith.apply(null, responses.open)
    const accessory = new EntryAccessory(log, config)

    accessory.getCurrentState((err, result) => {
      expect(result, 'to equal', 0)
      done()
    })
  })

  it('returns the target state of 1 when CLOSED', (done) => {
    simple.mock(EntryAccessory.prototype, '_request')
      .callbackWith.apply(null, responses.closed)
    const accessory = new EntryAccessory(log, config)

    accessory.getTargetState((err, result) => {
      expect(result, 'to equal', 1)
      done()
    })
  })

  it('sets the target state to CLOSED', (done) => {
    simple.mock(EntryAccessory.prototype, '_request')
      .callbackWith.apply(null, responses.empty)
    const accessory = new EntryAccessory(log, config)

    accessory.setTargetState(1, (err, resp, result) => {
      expect(result, 'to equal', 1)
      done()
    })
  })

  it('sets the target state to OPEN', (done) => {
    simple.mock(EntryAccessory.prototype, '_request')
      .callbackWith.apply(null, responses.empty)
    const accessory = new EntryAccessory(log, config)

    accessory.setTargetState(0, (err, resp, result) => {
      expect(result, 'to equal', 0)
      done()
    })
  })

  it('applies mappers in order', (done) => {
    simple.mock(EntryAccessory.prototype, '_request')
      .callbackWith.apply(null, responses.complex)
    const accessory = new EntryAccessory(log, Object.assign({}, config, {
      mappers: [
        {
          type: 'regex',
          parameters: {
            expression: '(open)'
          }
        },
        {
          type: 'static',
          parameters: {
            mapping: {
              open: '0'
            }
          }
        }
      ]
    }))

    accessory.getCurrentState((err, result) => {
      expect(result, 'to equal', 0)
      done()
    })
  })
})
