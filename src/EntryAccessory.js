const request = require('request')
const pollingtoevent = require('polling-to-event')
const mappers = require('./mappers')
const withHomebridge = require('./withHomebridge')

const OPEN = 0
const CLOSED = 1
const OPENING = 2
const CLOSING = 3
const STOPPED = 4

const configureMappers = (mapperConfigs = []) => {
  return mapperConfigs.reduce((acc, matches) => {
    const mapper = mappers[matches.type]
    return mapper
      ? acc.concat(mapper(matches.parameters))
      : acc
  }, [])
}

const configureApi = (apiConfig = {}) => {
  return [
    'getCurrentState',
    'getTargetState',
    'open',
    'close',
  ].reduce((acc, endpoint) => ({
    ...acc,
    [endpoint]: apiConfig[endpoint]
  }), {})
}

const Service, Characteristic

class EntryAccessory {
  constructor(log, config) {
    Service = EntryAccessory.homebridge.hap.Service
    Characteristic = EntryAccessory.homebridge.hap.Characteristic

    this.log = log
    this.config = config

    this.state = {
      target: null,
      current: null,
    }

    this.mappers = configureMappers(config.mappers)
    this.api = configureApi(config.api)
    this.getCurrentState = this._getStateType('current')
    this.getTargetState = this._getStateType('target')
    this.service = this._configureGarageDoorOpenerService()

    if (this.config.pollInterval) {
      this._startPolling()
    }
  }

  identify(callback) {
    callback(this.config.name)
  }

  getServices() {
    return [this.service]
  }

  _configureGarageDoorOpenerService() {
    const service = new Service.GarageDoorOpener(this.config.name)

    service
      .getCharacteristic(Characteristic.CurrentDoorState)
      .on('get', this.getCurrentState)

    service
      .getCharacteristic(Characteristic.TargetDoorState)
      .on('get', this.getTargetState)
      .on('set', this.setTargetState.bind(this))

    return service
  }

  _applyMappers(string) {
    return this.mappers.reduce((acc, toValue) => toValue(acc), string)
  }

  _startPolling() {
    const emitter = pollingtoevent(this.getCurrentState, {
      interval: this.config.pollInterval,
      longpolling: true,
    })

    emitter.on('longpoll', (state) => {
      this.service
        .getCharacteristic(Characteristic.CurrentDoorState)
        .setValue(state)
    })

    emitter.on('err', (err) => {
      this.log('Polling failed', err)
    })
  }

  _request(config, callback) {
    request({
      ...config,
      auth: this.config.auth,
    }, callback)
  }

  _debugLog() {
    if (this.config.debug) {
      this.log.apply(this, arguments)
    }
  }

  _handleError(err, callback) {
    this.log(err.message)
    callback(err)
  }

  _getTargetApi(targetState) {
    const { OPEN, CLOSED } = Characteristic.TargetDoorState

    if (targetState === OPEN) {
      return this.api.open
    }

    if (targetState === CLOSED) {
      return this.api.close
    }
  }

  _getState(config, callback) {
    if (!config.url) {
      return callback(null)
    }

    this._request(config, (err, resp, body) => {
      if (err) {
        return this._handleError(err, callback)
      }

      const state = parseInt(this._applyMappers(body))
      callback(null, state)
    })
  }

  _getStateType(stateType) {
    return (callback) => {
      const api = stateType === 'current'
      ? this.api.getCurrentState
      : this.api.getTargetState

      this._getState(api, (err, state) => {
        if (this.state[stateType] !== state) {
          this.state[stateType] = state
          this.log('%s state changed to %s', stateType, state)
        }

        callback(err, state)
      })
    }
  }

  setTargetState(targetState, callback) {
    const api = this._getTargetApi(targetState)

    if (!api.url) {
      return callback(null)
    }

    this.log('Setting target state to %s', targetState)

    return this._request(api, (err, resp) => {
      if (err) {
        return this._handleError(err, callback)
      }

      this.log('Set state successfully')
      callback(err, resp, targetState)
    })

  }
}

module.exports = withHomebridge(EntryAccessory)
