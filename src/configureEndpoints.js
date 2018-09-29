const methods = [
  'getCurrentState',
  'getTargetState',
  'open',
  'close',
]

module.exports = (endpoints = {}) => methods.reduce((acc, endpoint) => ({
  ...acc,
  [endpoint]: endpoints[endpoint]
}), {})
