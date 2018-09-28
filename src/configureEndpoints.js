const methods = [
  'getCurrentState',
  'getTargetState',
  'open',
  'close',
]

const defaultEndpoint = {
  url: ''
}

module.exports = (endpoints = {}) => methods.reduce((acc, endpoint) => ({
  ...acc,
  [endpoint]: endpoints[endpoint] || defaultEndpoint
}), {})
