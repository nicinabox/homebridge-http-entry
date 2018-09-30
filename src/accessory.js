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

      this.log = configureLogger(log, config.enableDebugLog)
      this.mappers = configureMappers(config.mappers)
      this.endpoints = configureEndpoints(config.endpoints)

      this.getCurrentState = this._getCurrentState.bind(this)
      this.setTargetState = this.setTargetState.bind(this)

      this.service = this._createService()

      configurePubSub(homebridge, {
        webhooks: config.webhooks,
        interval: config.pollInterval,
        getState: this.getCurrentState,
      }, this._handleNotification.bind(this), this._handleError.bind(this))
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
        .on('set', this.setTargetState)

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
      if (characteristic === 'CurrentDoorState') {
        this.service
          .setCharacteristic(Characteristic.CurrentDoorState, value)
          .setCharacteristic(Characteristic.TargetDoorState, value)
      } else {
        this.service.setCharacteristic(Characteristic[characteristic], value)
      }
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

    _getCurrentState(callback) {
      this._getState(this.endpoints.getState, (err, state) => {
        this.log.debug('Got accessory state %s', state)
        callback(err, state)
      })
    }

    setTargetState(value, callback) {
      const endpoint = this._getEndpoint(value)
      if (!endpoint.url) return

      this.log.debug('Setting accessory state to %s', value)

      this._request(endpoint, (err) => {
        if (err) {
          return this._handleError(err, callback)
        }

        callback(null)
      })

    }
  }
}
