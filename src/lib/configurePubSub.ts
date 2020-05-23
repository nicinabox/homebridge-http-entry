import pollingtoevent from 'polling-to-event';

declare global {
    function notificationRegistration(
        notificationID: string,
        handlerFunction: NotificationHandler,
        password?: string
    ): void;
}

export interface NotificationPayload {
    characteristic: string;
    value: number;
}

export interface PubSubConfig {
    interval?: number;
    webhooks?: WebHookConfig;
    getState: (done: () => {}) => void;
}

export type NotificationHandler = (json: NotificationPayload) => void;
export type ErrorHandler = (error: Error) => void;

export interface WebHookConfig {
    accessoryId: string;
    password?: string;
    onNotification: NotificationHandler;
    onError: ErrorHandler;
}

const isNotificationSupported = (webhooks?: WebHookConfig) => {
    return (
        webhooks &&
        webhooks.accessoryId &&
        global.notificationRegistration &&
        typeof global.notificationRegistration === 'function'
    );
};

// For use with homebridge-http-notification-server
const registerForNotifications = ({
    accessoryId,
    password,
    onNotification,
    onError,
}: WebHookConfig) => {
    try {
        global.notificationRegistration(accessoryId, onNotification, password);
    } catch (error) {
        onError(error);
    }
};

const startPolling = ({
    getState,
    interval = 1000,
    handleLongPoll,
    onError,
}: PubSubConfig & {
    handleLongPoll: NotificationHandler;
    onError: ErrorHandler;
}) => {
    const emitter = pollingtoevent(getState, {
        interval,
        longpolling: true,
    });

    emitter.on('longpoll', (value) => {
        handleLongPoll({
            characteristic: 'CurrentDoorState',
            value,
        });
    });

    emitter.on('err', onError);

    return emitter;
};

export default (
    config: PubSubConfig,
    onNotification: NotificationHandler,
    onError: ErrorHandler
) => {
    if (isNotificationSupported(config.webhooks)) {
        return registerForNotifications({
            ...config.webhooks!,
            onNotification,
            onError,
        });
    }

    if (config.interval) {
        return startPolling({
            ...config,
            handleLongPoll: onNotification,
            onError,
        });
    }
};
