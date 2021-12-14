import configureLogger from '../configureLogger';
import { Logger } from 'homebridge/lib/logger';

describe('configureLogger', () => {
    let setDebugEnabledSpy;

    beforeEach(() => {
        setDebugEnabledSpy = jest.spyOn(Logger, 'setDebugEnabled');
    });

    it('returns logger', () => {
        const log = jest.fn();
        expect(configureLogger(log)).toEqual(log);
    });

    it('enables debug logger', () => {
        const log = jest.fn();
        configureLogger(log, true);
        expect(setDebugEnabledSpy).toHaveBeenCalledWith(true);
    });
});
