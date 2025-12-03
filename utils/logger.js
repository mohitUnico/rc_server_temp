// Global flag to enable/disable logging without touching call sites.
// Set LOG_ENABLED=false (or 0, off, no) in .env to silence all logs (case-insensitive).
const rawLogEnabled = (process.env.LOG_ENABLED || '').toString().trim().toLowerCase();
const LOG_ENABLED = !(
    rawLogEnabled === 'false' ||
    rawLogEnabled === '0' ||
    rawLogEnabled === 'off' ||
    rawLogEnabled === 'no'
);

export class Logger {
    constructor(context = 'App') {
        this.context = context;
    }

    info(message, ...args) {
        if (!LOG_ENABLED) return;
        console.log(
            `[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`,
            ...args
        );
    }

    warn(message, ...args) {
        if (!LOG_ENABLED) return;
        console.warn(
            `[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`,
            ...args
        );
    }

    error(message, ...args) {
        if (!LOG_ENABLED) return;
        console.error(
            `[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`,
            ...args
        );
    }

    debug(message, ...args) {
        if (!LOG_ENABLED) return;
        if (process.env.NODE_ENV === 'development') {
            console.debug(
                `[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`,
                ...args
            );
        }
    }
} 