const xpath = require('xpath')
const DOM = require('xmldom').DOMParser

const staticMapper = ({mapping}) => value => {
  return mapping[value] || value
}

const regexMapper = ({ expression, captureGroup = 1 }) => value => {
  const re = new RegExp(expression)
  const matches = re.exec(value)

  if (matches && captureGroup in matches) {
    return matches[captureGroup]
  }
}

const xpathMapper = ({ expression, index = 0 }) => value => {
  const document = new DOM().parseFromString(value)
  const result = xpath.select(expression, document)

  if (typeof result === 'string') {
    return result
  }

  if (Array.isArray(result) && result.length > index) {
    return result[index].data
  }

  return value
}

module.exports = {
  static: staticMapper,
  regex: regexMapper,
  xpath: xpathMapper,
}
