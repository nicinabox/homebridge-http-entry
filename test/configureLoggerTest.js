const Logger = require('homebridge/lib/logger').Logger
const simple = require('simple-mock')
const configureLogger = require('../src/configureLogger')

describe('configureLogger', () => {
  let mockLog, accessoryLogger

  beforeEach(() => {
    mockLog = simple.mock(Logger.prototype, 'log', function () {})
    accessoryLogger = Logger.withPrefix(Math.random())
  })

  afterEach(() => {
    simple.restore()
  })

  it('does print debug output by default', () => {
    const log = configureLogger(accessoryLogger)

    log('info')
    log.debug('debug message')

    expect(mockLog.callCount, 'to equal', 1)
  })

  it('print debug output when configured', () => {
    const log = configureLogger(accessoryLogger, true)

    log('info')
    log.debug('debug')

    expect(mockLog.callCount, 'to equal', 2)
  })
})
