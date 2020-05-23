import { OptionsOfTextResponseBody } from "got";

export type EndpointMethods = 'getState' | 'open' | 'close' | 'cycle';

export interface EndpointConfig extends OptionsOfTextResponseBody {}

export type Endpoints = {
    [key in EndpointMethods]?: EndpointConfig;
};

const methods: EndpointMethods[] = ['getState', 'open', 'close', 'cycle'];

export default (endpoints: Endpoints = {}) =>
  methods.reduce(
    (acc, endpoint) => ({
      ...acc,
      [endpoint]: endpoints[endpoint],
    }),
    {}
  );
