import configurePubSub from '../configurePubSub';
import pollingtoevent from "polling-to-event";

describe('configurePubSub', () => {
    it('registers for notifications if supported', () => {
        const mockHomebridge = {
          notificationRegistration: jest.fn(),
        };
        const config = {
          webhooks: {
            accessoryId: 'test'
          },
        };

        configurePubSub(mockHomebridge, config, jest.fn(), jest.fn());
        expect(mockHomebridge.notificationRegistration).toBeCalled();
    });

    it('starts polling if notifications not supported', () => {
        const mockHomebridge = {};
        const config = {
          interval: 1000,
          getState: jest.fn(),
        };
        const result = configurePubSub(mockHomebridge, config, jest.fn(), jest.fn());
        expect(result).toBeInstanceOf(pollingtoevent);
    });

    it('returns undefined if notifications are not supported and polling interval is not specified', () => {
        const mockHomebridge = {};
        const config = {};
        const result = configurePubSub(mockHomebridge, config, jest.fn(), jest.fn());
        expect(result).toBeUndefined();
    });
});
