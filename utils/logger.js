export class Logger {
    constructor(context = 'App') {
        this.context = context;
    }

    info(message, ...args) {
        console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...args);
    }

    warn(message, ...args) {
        console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, ...args);
    }

    debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...args);
        }
    }
} 