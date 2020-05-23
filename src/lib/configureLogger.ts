import { setDebugEnabled } from 'homebridge/lib/logger';

export default (log, enableDebug = false) => {
    setDebugEnabled(enableDebug);
    return log;
};
