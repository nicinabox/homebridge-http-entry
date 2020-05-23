import configureMappers from '../configureMappers';
import mappers from '../mappers';

describe('configureMappers', () => {
    it('returns an array of mapper functions', () => {
        const mapperConfigs = [
            {
                type: 'static' as const,
                parameters: {
                    mapping: {
                        OPENING: 2,
                        CLOSING: 3,
                    },
                },
            },
        ];

        const transforms = configureMappers(mapperConfigs);
        expect(transforms[0]).toEqual(expect.any(Function));
    });
});
