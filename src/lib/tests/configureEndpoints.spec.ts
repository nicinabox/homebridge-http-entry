import configureEndpoints from '../configureEndpoints';

describe('configureEndpoints', () => {
    it('returns endpoint options for defined endpoints', () => {
        const endpoints = {
            getState: {
                url: 'getStateUrl',
                method: 'PUT' as const,
                body: 'OPEN',
            },
        };
        expect(configureEndpoints(endpoints)).toEqual({
            getState: {
                url: 'getStateUrl',
                method: 'PUT',
                body: 'OPEN',
            },
        });
    });
});
