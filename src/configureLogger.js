const { setDebugEnabled } = require('homebridge/lib/logger')

module.exports = (log, enableDebug = false) => {
  setDebugEnabled(enableDebug)
  return log
}
