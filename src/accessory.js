const request = require('request')
const configurePubSub = require('./configurePubSub')
const configureMappers = require('./configureMappers')
const configureEndpoints = require('./configureEndpoints')
const configureLogger = require('./configureLogger')

const OPEN = 0
const CLOSED = 1
const OPENING = 2
const CLOSING = 3
const STOPPED = 4

module.exports = (homebridge) => {
  const { Service, Characteristic } = homebridge.hap

  return class EntryAccessory {
    constructor(log, config) {
      this.config = config

      this.state = {
        target: null,
        current: null,
      }

      this.log = configureLogger(log, config.enableDebugLog)
      this.mappers = configureMappers(config.mappers)
      this.endpoints = configureEndpoints(config.endpoints)

      this.getCurrentState = this._getStateType('current')
      this.getTargetState = this._getStateType('target')
      this.service = this._createService()

      configurePubSub(homebridge, {
        webhooks: config.webhooks,
        interval: config.pollInterval,
        getState: this.getCurrentState.bind(this),
      }, this._handleNotification, this._handleError)
    }

    identify(callback) {
      callback(this.config.name)
    }

    getServices() {
      return [this.service]
    }

    _createService() {
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

    _request(config, callback) {
      request({
        ...config,
        auth: this.config.auth,
      }, callback)
    }

    _handleNotification({characteristic, value}) {
      this.service.setCharacteristic(Characteristic[characteristic], value)
    }

    _handleError(err, callback) {
      this.log.error(err.message)
      callback && callback(err)
    }

    _getTargetApi(targetState) {
      const { OPEN, CLOSED } = Characteristic.TargetDoorState

      if (targetState === OPEN) {
        return this.endpoints.open
      }

      if (targetState === CLOSED) {
        return this.endpoints.close
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
        ? this.endpoints.getCurrentState
        : this.endpoints.getTargetState

        this._getState(api, (err, state) => {
          if (this.state[stateType] !== state) {
            this.state[stateType] = state
            this.log.debug('%s state changed to %s', stateType, state)
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

      this.log.debug('Setting target state to %s', targetState)

      return this._request(api, (err, resp) => {
        if (err) {
          return this._handleError(err, callback)
        }

        this.log.debug('Set state successfully')
        callback(err, resp, targetState)
      })

    }
  }
}
