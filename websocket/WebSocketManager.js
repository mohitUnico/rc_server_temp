import WebSocket from 'ws';
import { startPing, stopPing } from '../utils/ping.js';
import { Logger } from '../utils/logger.js';

export class WebSocketManager {
    constructor(assetType, config) {
        this.assetType = assetType;
        this.config = config;
        this.socket = null;
        this.isReady = false;
        this.logger = new Logger(`WebSocket:${assetType}`);
        this.messageHandlers = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.logger.info(`Attempting to connect to ${this.assetType} WebSocket at ${this.config.url}`);
                this.socket = new WebSocket(this.config.url, {
                    headers: { token: this.config.authToken }
                });

                this.socket.on('open', () => {
                    this.isReady = true;
                    this.logger.info(`Successfully connected to ${this.assetType} WebSocket`);
                    this.logger.info(`WebSocket readyState: ${this.socket.readyState} (OPEN)`);
                    startPing(this.socket);
                    resolve();
                });

                this.socket.on('message', (data) => {
                    this.logger.debug(`Received message from ${this.assetType} WebSocket`);
                    this.handleMessage(data);
                });

                this.socket.on('close', (code, reason) => {
                    this.isReady = false;
                    this.logger.warn(`${this.assetType} WebSocket closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
                    this.logger.info(`Attempting to reconnect to ${this.assetType} WebSocket in 5 seconds...`);
                    setTimeout(() => this.connect(), 5000);
                });

                this.socket.on('error', (error) => {
                    this.logger.error(`${this.assetType} WebSocket connection error:`, error);
                    reject(error);
                });

            } catch (error) {
                this.logger.error(`Failed to create WebSocket connection to ${this.assetType}:`, error);
                reject(error);
            }
        });
    }

    async disconnect() {
        if (this.socket) {
            this.logger.info(`Initiating disconnect from ${this.assetType} WebSocket`);
            stopPing();
            this.socket.close();
            this.isReady = false;
            this.logger.info(`Successfully disconnected from ${this.assetType} WebSocket`);
        } else {
            this.logger.warn(`Attempted to disconnect from ${this.assetType} WebSocket, but no connection exists`);
        }
    }

    async subscribe(symbol) {
        if (this.isConnected()) {
            const message = {
                ac: 'subscribe',
                params: `${symbol}$${this.config.region}`,
                types: 'quote'
            };
            this.socket.send(JSON.stringify(message));
            this.logger.info(`Subscribed to ${symbol} on ${this.assetType} WebSocket`);
        } else {
            this.logger.warn(`Cannot subscribe to ${symbol} on ${this.assetType}: WebSocket not connected`);
        }
    }

    async unsubscribe(symbol) {
        if (this.isConnected()) {
            const message = {
                ac: 'unsubscribe',
                params: `${symbol}$${this.config.region}`,
                types: 'quote'
            };
            this.socket.send(JSON.stringify(message));
            this.logger.info(`Unsubscribed from ${symbol} on ${this.assetType} WebSocket`);
        } else {
            this.logger.warn(`Cannot unsubscribe from ${symbol} on ${this.assetType}: WebSocket not connected`);
        }
    }

    isConnected() {
        const connected = this.socket && this.socket.readyState === WebSocket.OPEN;
        if (!connected) {
            this.logger.debug(`${this.assetType} WebSocket connection status: ${this.socket ? this.getReadyStateString(this.socket.readyState) : 'No socket instance'}`);
        }
        return connected;
    }

    getReadyStateString(readyState) {
        switch (readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    handleMessage(data) {
        try {
            const raw = typeof data === 'string' ? data : data.toString();
            const message = JSON.parse(raw);

            if (message.resAc === 'ping' || message.resAc === 'pong') return;

            // Notify all registered handlers
            this.messageHandlers.forEach(handler => {
                handler(message, this.assetType);
            });

        } catch (error) {
            this.logger.error(`Error parsing message from ${this.assetType}:`, error);
        }
    }

    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    offMessage(handler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
        }
    }
} 