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
                this.socket = new WebSocket(this.config.url, {
                    headers: { token: this.config.authToken }
                });

                this.socket.on('open', () => {
                    this.isReady = true;
                    this.logger.info(`Connected to ${this.assetType} WebSocket`);
                    startPing(this.socket);
                    resolve();
                });

                this.socket.on('message', (data) => {
                    this.handleMessage(data);
                });

                this.socket.on('close', () => {
                    this.isReady = false;
                    this.logger.warn(`${this.assetType} WebSocket closed. Reconnecting...`);
                    setTimeout(() => this.connect(), 5000);
                });

                this.socket.on('error', (error) => {
                    this.logger.error(`${this.assetType} WebSocket error:`, error);
                    reject(error);
                });

            } catch (error) {
                this.logger.error(`Failed to connect to ${this.assetType}:`, error);
                reject(error);
            }
        });
    }

    async disconnect() {
        if (this.socket) {
            stopPing();
            this.socket.close();
            this.isReady = false;
            this.logger.info(`Disconnected from ${this.assetType} WebSocket`);
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
            this.logger.info(`Subscribed to ${symbol} on ${this.assetType}`);
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
            this.logger.info(`Unsubscribed from ${symbol} on ${this.assetType}`);
        }
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
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