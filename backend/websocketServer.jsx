const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Enable more detailed logging
const debug = true;
function log(...args) {
  if (debug) console.log(new Date().toISOString(), ...args);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  log('HTTP request received:', req.url);
  
  // Add CORS headers with more permissive settings
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Add a health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'WebSocket server is running' }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Create WebSocket server with proper configuration
const wss = new WebSocket.Server({ 
  server,
  // No path restriction to allow connections from any path
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

// Start the server on port 8080 and bind to all interfaces
server.listen(8080, '0.0.0.0', () => {
  log('WebSocket server is running on port 8080');
  log('To test the server, visit http://localhost:8080/health');
});