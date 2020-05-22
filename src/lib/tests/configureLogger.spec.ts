import configureLogger from '../configureLogger'
import { setDebugEnabled } from "homebridge/lib/logger";

jest.mock('homebridge/lib/logger', () => ({
    setDebugEnabled: jest.fn()
}))

describe('configureLogger', () => {
    it('returns logger', () => {
        const log = jest.fn()
        expect(configureLogger(log)).toEqual(log);
    });

    it('enables debug logger', () => {
        const log = jest.fn();
        configureLogger(log, true);
        expect(setDebugEnabled).toHaveBeenCalledWith(true);
    });
});
