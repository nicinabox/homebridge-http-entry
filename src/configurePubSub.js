const pollingtoevent = require('polling-to-event')

const isNotificationSupported = (homebridge, webhooks = {}) => {
  return webhooks.accessoryId && typeof homebridge.notificationRegistration === 'function'
}

const registerForNotifications = (homebridge, { accessoryId, password, onNotification, onError }) => {
  try {
    homebridge.notificationRegistration(accessoryId, onNotification, password)
  } catch (error) {
    onError(error)
  }
}

const startPolling = ({ getState, interval, handleLongPoll, onError }) => {
  const emitter = pollingtoevent(getState, {
    interval,
    longpolling: true,
  })

  emitter.on('longpoll', value => {
    handleLongPoll({
      characteristic: 'CurrentDoorState',
      value,
    })
  })

  emitter.on('err', onError)

  return emitter
}

module.exports = (homebridge, config, onNotification, onError) => {
  if (isNotificationSupported(homebridge, config.webhooks)) {
    return registerForNotifications(homebridge, {
      ...config.webhooks,
      onNotification,
      onError
    })
  }

  if (config.interval) {
    return startPolling({
      ...config,
      handleLongPoll: onNotification,
      onError
    })
  }
}
