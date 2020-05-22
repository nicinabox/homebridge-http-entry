import { Options as GotOptions } from 'got';

export type EndpointMethods = 'getState' | 'open' | 'close' | 'cycle';

export type Endpoints = {
    [key in EndpointMethods]?: GotOptions & {
        url: string;
    };
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
