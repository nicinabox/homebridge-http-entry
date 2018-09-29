const methods = [
  'getState',
  'open',
  'close',
]

module.exports = (endpoints = {}) => methods.reduce((acc, endpoint) => ({
  ...acc,
  [endpoint]: endpoints[endpoint]
}), {})
