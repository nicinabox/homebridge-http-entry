const { setDebugEnabled } = require('homebridge/lib/logger')

module.exports = (log, enableDebug) => {
  setDebugEnabled(enableDebug)
  return log
}
