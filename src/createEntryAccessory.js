const request = require('request')
const pollingtoevent = require('polling-to-event')
const mappers = require('./mappers')

const OPEN = 0
const CLOSED = 1
const OPENING = 2
const CLOSING = 3
const STOPPED = 4

module.exports = (homebridge) => {
  const { Service, Characteristic } = homebridge.hap

  return class EntryAccessory {
    constructor(log, config) {
      this.log = log

      this.name = config.name
      this.debug = config.debug
      this.pollInterval = config.pollInterval

      this.mappers = this._configureMappers(config.mappers)
      this.api = this._configureApi(config.api)

      this.auth = {
        username: config.username,
        password: config.password,
      }

      this.state = {
        target: null,
        current: null,
      }
      this.service = null
      this.getCurrentState = this._getStateType('current')
      this.getTargetState = this._getStateType('target')

      if (this.pollInterval) {
        this._startPolling()
      }
    }

    identify(callback) {
      callback(this.name)
    }

    getServices() {
      this.service = new Service.GarageDoorOpener(this.name)

      this.service
        .getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', this.getCurrentState)

      this.service
        .getCharacteristic(Characteristic.TargetDoorState)
        .on('get', this.getTargetState)
        .on('set', this.setTargetState.bind(this))

      return [this.service]
    }

    _configureMappers(mapperConfig = []) {
      return mapperConfig.reduce((acc, matches) => {
        const mapper = mappers[matches.type]
        return mapper
          ? acc.concat(mapper(matches.parameters))
          : acc
      }, [])
    }

    _configureApi(apiConfig = {}) {
      return [
        'getCurrentState',
        'getTargetState',
        'open',
        'close',
      ].reduce((acc, key) => ({
        ...acc,
        [key]: {
          body: '',
          method: 'GET',
          ...apiConfig[key]
        }
      }), {})
    }

    _applyMappers(string) {
      return this.mappers.reduce((acc, toValue) => toValue(acc), string)
    }

    _startPolling() {
      const emitter = pollingtoevent(this.getCurrentState, {
        interval: this.pollInterval,
        longpolling: true,
      })

      emitter.on('longpoll', (state) => {
        switch (state) {
          case OPENING:
            return this.service
              .getCharacteristic(Characteristic.TargetDoorState)
              .setValue(OPEN)

          case CLOSING:
            return this.service
              .getCharacteristic(Characteristic.TargetDoorState)
              .setValue(CLOSED)

          default:
            return this.service
              .getCharacteristic(Characteristic.CurrentDoorState)
              .setValue(state)
        }
      })

      emitter.on('err', (err) => {
        this.log('Polling failed', err)
      })
    }

    _request(config, callback) {
      request({
        url: config.url,
        body: config.body,
        method: config.method,
        auth: this.auth,
        headers: {
          Authorization: 'Basic ' + new Buffer(this.auth.username + ':' + this.auth.password).toString('base64')
        }
      }, callback)
    }

    _debugLog() {
      if (this.debug) {
        this.log.apply(this, arguments)
      }
    }

    _handleError(err, callback) {
      this.log(err.message)
      callback(err)
    }

    _getTargetApiConfig(targetState) {
      switch (targetState) {
        case Characteristic.TargetDoorState.OPEN:
          return this.api.open

        case Characteristic.TargetDoorState.CLOSED:
          return this.api.close
      }
    }

    _getState(config, callback) {
      if (!config.url) {
        return callback(null)
      }

      this._request(config, (err, response, body) => {
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
      this.log('Setting target state to %s', targetState)
      const targetConfig = this._getTargetApiConfig(targetState)

      if (!targetConfig.url) {
        return callback(null)
      }

      return this._request(targetConfig, (err, response) => {
        if (err) {
          return this._handleError(err, callback)
        }

        this.log('Set state successfully')
        callback(err, response, targetState)
      })

    }
  }
}
