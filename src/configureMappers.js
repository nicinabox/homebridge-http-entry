const mappers = require('./mappers')

module.exports = (mapperConfigs = []) => {
  return mapperConfigs.reduce((acc, matches) => {
    const mapper = mappers[matches.type]
    return mapper
      ? acc.concat(mapper(matches.parameters))
      : acc
  }, [])
}
