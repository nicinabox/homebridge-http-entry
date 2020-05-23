import configurePubSub from '../configurePubSub';
import pollingtoevent from 'polling-to-event';

describe('configurePubSub', () => {
    beforeEach(() => {
        global.notificationRegistration = jest.fn();
    });

    it('registers for notifications if supported', () => {
        const config = {
            webhooks: {
                accessoryId: 'test',
            },
        };

        configurePubSub(config, jest.fn(), jest.fn());
        expect(global.notificationRegistration).toBeCalled();
    });

    it('starts polling if notifications not supported', () => {
        const config = {
            interval: 1000,
            getState: jest.fn(),
        };
        const result = configurePubSub(config, jest.fn(), jest.fn());
        expect(result).toBeInstanceOf(pollingtoevent);
    });

    it('returns undefined if notifications are not supported and polling interval is not specified', () => {
        const config = {};
        const result = configurePubSub(config, jest.fn(), jest.fn());
        expect(result).toBeUndefined();
    });
});
