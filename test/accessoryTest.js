const simple = require('simple-mock')
const Logger = require('homebridge/lib/logger').Logger
const accessory = require('../src/accessory')

class MockGarageDoorOpener {
  getCharacteristic() {
    return this
  }
  on() {
    return this
  }
}

const homebridge = {
  notificationRegistration: () => {},
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

const log = Logger.withPrefix('EntryAccessory')

const config = {
  name: 'Gate',
  logLevel: 0,
  webhooks: {
    accessoryId: 'gate'
  },
  endpoints: {
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

describe('accessory', () => {
  it('returns a EntryAccessory class', () => {
    const Accessory = accessory(homebridge)
    const plugin = new Accessory(log, config)

    expect(plugin.constructor.name, 'to be', 'EntryAccessory')
  })
})

describe('EntryAccessory', () => {
  let Accessory

  beforeEach(() => {
    Accessory = accessory(homebridge)
  })

  it('returns current state of 0 when OPEN', (done) => {
    simple.mock(Accessory.prototype, '_request')
      .callbackWith.apply(null, responses.open)

    const plugin = new Accessory(log, config)

    plugin.getCurrentState((err, result) => {
      expect(result, 'to equal', 0)
      done()
    })
  })

  it('returns the target state of 1 when CLOSED', (done) => {
    simple.mock(Accessory.prototype, '_request')
      .callbackWith.apply(null, responses.closed)

    const plugin = new Accessory(log, config)

    plugin.getTargetState((err, result) => {
      expect(result, 'to equal', 1)
      done()
    })
  })

  it('sets the target state to CLOSED', (done) => {
    simple.mock(Accessory.prototype, '_request')
      .callbackWith.apply(null, responses.empty)

    const plugin = new Accessory(log, config)

    plugin.setTargetState(1, (err, resp, result) => {
      expect(result, 'to equal', 1)
      done()
    })
  })

  it('sets the target state to OPEN', (done) => {
    simple.mock(Accessory.prototype, '_request')
      .callbackWith.apply(null, responses.empty)

    const plugin = new Accessory(log, config)

    plugin.setTargetState(0, (err, resp, result) => {
      expect(result, 'to equal', 0)
      done()
    })
  })

  it('applies mappers in order', (done) => {
    simple.mock(Accessory.prototype, '_request')
      .callbackWith.apply(null, responses.complex)

    const plugin = new Accessory(log, Object.assign({}, config, {
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

    plugin.getCurrentState((err, result) => {
      expect(result, 'to equal', 0)
      done()
    })
  })
})
