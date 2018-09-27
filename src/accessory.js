const request = require('request')
const mappers = require('./mappers')
const configurePubSub = require('./configurePubSub')

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

const configureEndpoints = (endpoints = {}) => {
  return [
    'getCurrentState',
    'getTargetState',
    'open',
    'close',
  ].reduce((acc, endpoint) => ({
    ...acc,
    [endpoint]: endpoints[endpoint]
  }), {})
}

const createLogger = (log, level) => {
  return {
    log: (args) => level > 0 && log.apply(log, args),
    verbose: (args) => level > 1 && log.apply(log, args),
  }
}

module.exports = (homebridge) => {
  const Service = homebridge.hap.Service
  const Characteristic = homebridge.hap.Characteristic

  return class EntryAccessory {
    constructor(log, config) {
      this.config = config

      this.state = {
        target: null,
        current: null,
      }

      this.logger = createLogger(log, config.logLevel)
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
      this.logger.log('!! %s', err.message)
      callback(err)
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
            this.logger.verbose('%s state changed to %s', stateType, state)
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

      this.logger.verbose('Setting target state to %s', targetState)

      return this._request(api, (err, resp) => {
        if (err) {
          return this._handleError(err, callback)
        }

        this.logger.verbose('Set state successfully')
        callback(err, resp, targetState)
      })

    }
  }
}
