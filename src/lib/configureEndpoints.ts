import { OptionsOfTextResponseBody } from 'got';

export type EndpointMethods = 'getState' | 'open' | 'close' | 'cycle';

export type EndpointRequestConfig = OptionsOfTextResponseBody;

export type EndpointConfig = {
    [key in EndpointMethods]?: EndpointRequestConfig;
};

const methods: EndpointMethods[] = ['getState', 'open', 'close', 'cycle'];

export default (endpoints: EndpointConfig = {}) =>
    methods.reduce(
        (acc, endpoint) => ({
            ...acc,
            [endpoint]: endpoints[endpoint],
        }),
        {}
    );
