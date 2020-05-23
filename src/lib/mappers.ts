import xpath from 'xpath'
import DOM from 'xmldom'

export type MapperFunction = (value: string) => string;

export interface StaticMapperParams {
    mapping: {
        [key: string]: string;
    }
}

export interface RegexMapperParams {
    expression: string;
    captureGroup?: number;
}

export interface XPathMapperParams {
    expression: string;
    index?: number;
}

export const staticMapper = ({ mapping }: StaticMapperParams): MapperFunction => (value) => {
  return mapping[value] || value;
};

export const regexMapper = ({
  expression,
  captureGroup = 1,
}: RegexMapperParams): MapperFunction => (value) => {
  const re = new RegExp(expression);
  const matches = re.exec(value);

  if (matches && captureGroup in matches) {
    return matches[captureGroup];
  }

  return '';
};

export const xpathMapper = ({
  expression,
  index = 0,
}: XPathMapperParams): MapperFunction => (value) => {
  const document = new DOM.DOMParser().parseFromString(value);
  const result = xpath.select(expression, document);

  if (typeof result === "string") {
    return result;
  }

  if (Array.isArray(result) && result.length > index) {
    return result[index].data;
  }

  return value;
};

export default {
    static: staticMapper,
    regex: regexMapper,
    xpath: xpathMapper,
}
