const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Enable more detailed logging
const debug = true;
function log(...args) {
  if (debug) console.log(new Date().toISOString(), ...args);
}

// Create Express app
const app = express();

// Configure Express middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['X-Requested-With', 'content-type'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Create HTTP server using Express app
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws', // Specify a path for WebSocket connections
  verifyClient: (info) => {
    log('Connection attempt from:', info.origin, info.req.url);
    return true; // Accept all connections
  }
});

// Track rooms and clients
const rooms = new Map();
const pendingJoinRequests = new Map();

wss.on('connection', (ws, req) => {
  log('New WebSocket connection established');
  
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      log('Received message:', data.type);
      
      switch (data.type) {
        case 'join':
          handleJoinRequest(ws, data);
          break;
        case 'code':
          handleCodeUpdate(ws, data);
          break;
        default:
          log('Unknown message type:', data.type);
      }
    } catch (error) {
      log('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    log('WebSocket connection closed');
    // Handle cleanup when a client disconnects
    for (const [roomId, room] of rooms.entries()) {
      if (room.clients.has(ws)) {
        room.clients.delete(ws);
        log(`Client removed from room ${roomId}`);
        
        // Notify other clients in the room
        broadcastToRoom(roomId, {
          type: 'userLeft',
          userId: room.userIds.get(ws)
        });
        
        room.userIds.delete(ws);
        
        // If room is empty, remove it
        if (room.clients.size === 0) {
          rooms.delete(roomId);
          log(`Room ${roomId} removed (empty)`);
        }
      }
    }
  });
  
  ws.on('error', (error) => {
    log('WebSocket error:', error);
  });
});

function handleJoinRequest(ws, data) {
  const { roomId, userId, userName } = data;
  
  if (!roomId) {
    log('Invalid join request (no roomId):', data);
    return;
  }
  
  log(`Join request for room ${roomId} from user ${userId} (${userName})`);
  
  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    log(`Creating new room: ${roomId}`);
    rooms.set(roomId, {
      clients: new Set(),
      userIds: new Map(),
      userNames: new Map(),
      owner: userId
    });
  }
  
  const room = rooms.get(roomId);
  
  // Add client to room
  room.clients.add(ws);
  room.userIds.set(ws, userId);
  room.userNames.set(userId, userName);
  
  log(`User ${userId} (${userName}) joined room ${roomId}`);
  
  // Notify client that join was successful
  ws.send(JSON.stringify({
    type: 'joinRequestAccepted',
    roomId,
    userId
  }));
  
  // Notify other clients in the room
  broadcastToRoom(roomId, {
    type: 'userJoined',
    userId,
    userName
  }, ws);
}

function handleCodeUpdate(ws, data) {
  const { roomId, code, fileId, userId } = data;
  
  if (!roomId || !fileId) {
    log('Invalid code update data:', data);
    return;
  }
  
  log(`Code update in room ${roomId} for file ${fileId} from user ${userId}`);
  
  if (rooms.has(roomId)) {
    broadcastToRoom(roomId, {
      type: 'code',
      code,
      fileId,
      userId
    }, ws);
  }
}

function broadcastToRoom(roomId, message, excludeClient = null) {
  if (!rooms.has(roomId)) {
    log(`Cannot broadcast to non-existent room: ${roomId}`);
    return;
  }
  
  const room = rooms.get(roomId);
  const messageStr = JSON.stringify(message);
  
  for (const client of room.clients) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  }
}

// Ping clients periodically to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      log('Terminating inactive connection');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to the CodeSync API',
    status: 'running',
    websocketStatus: 'active',
    rooms: rooms.size
  });
});

// Catch-all route for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
const WS_PORT = 8080;

server.listen(PORT, '0.0.0.0', () => {
  log(`Combined server running on port ${PORT}`);
  log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});