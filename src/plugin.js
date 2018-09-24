const createEntryAccessory = require('./createEntryAccessory')

module.exports = (homebridge) => {
  homebridge.registerAccessory(
    'homebridge-http-entry',
    'HttpEntry',
    createEntryAccessory(homebridge)
  )
}
