const methods = [
  'getState',
  'open',
  'close',
  'cycle',
]

module.exports = (endpoints = {}) => methods.reduce((acc, endpoint) => ({
  ...acc,
  [endpoint]: endpoints[endpoint]
}), {})
