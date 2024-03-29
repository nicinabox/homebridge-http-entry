import { API } from 'homebridge';
import nock from 'nock';
import { HttpEntryAccessory } from '../accessory';

class MockService {
    setCharacteristic() {
        return this;
    }
    getCharacteristic() {
        return this;
    }
    on() {
        return this;
    }
}

const mockHomebridge = {
    on: jest.fn(),
    hap: {
        Service: {
            GarageDoorOpener: MockService,
            AccessoryInformation: MockService,
        },
        Characteristic: {
            CurrentDoorState: {},
            TargetDoorState: {
                OPEN: 0,
                CLOSED: 1,
            },
        },
    },
};

describe('EntryAccessory', () => {
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            error: jest.fn(),
        };
    });

    it('returns current state of 0 when OPEN', (done) => {
        nock('https://gate.lan').get('/getState').reply(200, '0');

        const config = {
            name: 'gate',
            endpoints: {
                getState: {
                    url: 'https://gate.lan/getState',
                    method: 'get' as const,
                },
            },
        };
        const accessory = new HttpEntryAccessory(
            mockLogger,
            config,
            (mockHomebridge as unknown) as API
        );

        accessory.handleGetCurrentDoorState((err, state) => {
            expect(err).toBeNull();
            expect(state).toEqual(0);
            done();
        });
    });

    it('returns the current state of 1 when CLOSED', (done) => {
        nock('https://gate.lan').get('/getState').reply(200, '1');

        const config = {
            name: 'gate',
            endpoints: {
                getState: {
                    url: 'https://gate.lan/getState',
                    method: 'get' as const,
                },
            },
        };
        const accessory = new HttpEntryAccessory(
            mockLogger,
            config,
            (mockHomebridge as unknown) as API
        );

        accessory.handleGetCurrentDoorState((err, state) => {
            expect(err).toBeNull();
            expect(state).toEqual(1);
            done();
        });
    });

    it('makes requests with auth', (done) => {
        nock('https://gate.lan')
            .get('/getState')
            .basicAuth({ user: 'user', pass: 'password' })
            .reply(200, '1');

        const config = {
            name: 'gate',
            auth: {
                username: 'user',
                password: 'password',
            },
            endpoints: {
                getState: {
                    url: 'https://gate.lan/getState',
                    method: 'get' as const,
                },
            },
        };
        const accessory = new HttpEntryAccessory(
            mockLogger,
            config,
            (mockHomebridge as unknown) as API
        );

        accessory.handleGetCurrentDoorState((err, state) => {
            expect(err).toBeNull();
            expect(state).toEqual(1);
            done();
        });
    });

    it('applies mappers in order', (done) => {
        nock('https://gate.lan').get('/getState').reply(200, `It's open`);

        const config = {
            name: 'gate',
            endpoints: {
                getState: {
                    url: 'https://gate.lan/getState',
                    method: 'get' as const,
                },
            },
            mappers: [
                {
                    type: 'regex' as const,
                    parameters: {
                        expression: '(open)',
                    },
                },
                {
                    type: 'static' as const,
                    parameters: {
                        mapping: {
                            open: '0',
                        },
                    },
                },
            ],
        };
        const accessory = new HttpEntryAccessory(
            mockLogger,
            config,
            (mockHomebridge as unknown) as API
        );

        accessory.handleGetCurrentDoorState((err, state) => {
            expect(err).toBeNull();
            expect(state).toEqual(0);
            done();
        });
    });

    it('sets the target state', (done) => {
        nock('https://gate.lan').get('/open').reply(200, '0');

        const config = {
            name: 'gate',
            endpoints: {
                open: {
                    url: 'https://gate.lan/open',
                    method: 'get' as const,
                },
            },
        };
        const accessory = new HttpEntryAccessory(
            mockLogger,
            config,
            (mockHomebridge as unknown) as API
        );

        accessory.handleSetTargetDoorState(0, (err, state) => {
            expect(err).toBeNull();
            expect(state).toBeUndefined();
            done();
        });
    });
});
