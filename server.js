// server.js
import { startFlutterWebSocket } from './sockets/flutterClient.js'
import { connectToITick } from './sockets/iTick.js';

// Start all services
connectToITick();
startFlutterWebSocket();