import mappers, {
  MapperFunction,
  StaticMapperParams,
  RegexMapperParams,
  XPathMapperParams,
} from "./mappers";

export interface StaticMapperConfig {
    type: 'static'
    parameters: StaticMapperParams
}

export interface RegexMapperConfig {
    type: 'regex'
    parameters: RegexMapperParams
}

export interface XPathMapperConfig {
    type: 'xpath'
    parameters: XPathMapperParams
}

export type MapperConfig =
  | StaticMapperConfig
  | RegexMapperConfig
  | XPathMapperConfig

export default (mapperConfigs: MapperConfig[] = []) => {
  return mapperConfigs.reduce((acc: MapperFunction[], config) => {
    switch (config.type) {
      case 'static':
        return [...acc, mappers.static(config.parameters)];
      case 'regex':
        return [...acc, mappers.regex(config.parameters)];
      case 'xpath':
        return [...acc, mappers.xpath(config.parameters)];
      default:
       return acc;
    }
  }, []);
};
