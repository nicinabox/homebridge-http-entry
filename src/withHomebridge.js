module.exports = Accessory => homebridge => {
  Accessory.homebridge = homebridge
  return Accessory
}
