const accessory = require('./accessory')

module.exports = (homebridge) => {
  homebridge.registerAccessory(
    'homebridge-http-entry',
    'HttpEntry',
    accessory(homebridge)
  )
}
