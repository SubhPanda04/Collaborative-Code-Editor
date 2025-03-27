const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

const debug = true;
function log(...args) {
  if (debug) console.log(new Date().toISOString(), ...args);
}

wss.on('connection', (ws) => {
  log('New WebSocket connection established');
  ws.id = uuidv4();
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      log('Received message:', data.type, 'for room:', data.roomId);
      
      switch (data.type) {
        case 'join':
          handleJoin(ws, data);
          break;
        case 'joinAsOwner':
          handleJoinAsOwner(ws, data);
          break;
        case 'requestJoin':
          handleRequestJoin(ws, data);
          break;
        case 'acceptJoinRequest':
          handleAcceptJoinRequest(ws, data);
          break;
        case 'rejectJoinRequest':
          handleRejectJoinRequest(ws, data);
          break;
        case 'code':
          handleCodeUpdate(ws, data);
          break;
        case 'leave':
          handleLeave(ws, data);
          break;
        case 'getUsersList':
          handleGetUsersList(ws, data);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    log('WebSocket connection closed:', ws.id);
    handleDisconnect(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleJoin(ws, data) {
  const { roomId, userId, userName } = data;
  
  if (!roomId || !userId) {
    log('Invalid join data:', data);
    return;
  }
  
  log(`User ${userName} (${userId}) joining room ${roomId}`);
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  
  const room = rooms.get(roomId);
  room.set(userId, { 
    ws, 
    userName: userName || 'Anonymous',
    userId
  });
  
  ws.userId = userId;
  ws.roomId = roomId;
  ws.userName = userName || 'Anonymous';
  
  // Notify all users in the room about new connection
  broadcastToRoom(roomId, {
    type: 'userJoined',
    userId,
    userName: ws.userName
  });
  
  const usersList = Array.from(room.values()).map(user => user.userName);
  log('Sending users list to new user:', usersList);
  
  ws.send(JSON.stringify({
    type: 'usersList',
    users: usersList
  }));
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
    });
  }
}

function handleLeave(ws, data) {
  const { roomId, userId } = data;
  
  if (!roomId || !userId) {
    log('Invalid leave data:', data);
    return;
  }
  
  log(`User ${userId} leaving room ${roomId}`);
  
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    const user = room.get(userId);
    const userName = user ? user.userName : 'Unknown';
    
    room.delete(userId);
    if (room.size === 0) {
      rooms.delete(roomId);
      log(`Room ${roomId} deleted (empty)`);
    }
    
    broadcastToRoom(roomId, {
      type: 'userLeft',
      userId,
      userName
    });
  }
}

function handleJoinAsOwner(ws, data) {
  const { roomId, userId, userName } = data;
  
  if (!roomId || !userId) {
    log('Invalid join as owner data:', data);
    return;
  }
  
  log(`User ${userName} (${userId}) joining room ${roomId} as owner`);
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
    rooms.get(roomId).owner = userId;
  }
  
  const room = rooms.get(roomId);
  room.set(userId, { 
    ws, 
    userName: userName || 'Anonymous',
    userId,
    isOwner: true
  });
  ws.userId = userId;
  ws.roomId = roomId;
  ws.userName = userName || 'Anonymous';
  ws.isOwner = true;
  
  broadcastToRoom(roomId, {
    type: 'userJoined',
    userId,
    userName: ws.userName,
    isOwner: true
  });
  
  const usersList = Array.from(room.values())
    .filter(user => !user.isPending)
    .map(user => user.userName);
  
  log('Sending users list to owner:', usersList);
  
  ws.send(JSON.stringify({
    type: 'usersList',
    users: usersList
  }));
}

function handleRequestJoin(ws, data) {
  const { roomId, userId, userName } = data;
  
  if (!roomId || !userId) {
    log('Invalid join request data:', data);
    return;
  }
  
  log(`User ${userName} (${userId}) requesting to join room ${roomId}`);
  
  if (!rooms.has(roomId)) {
    // Room doesn't exist
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room does not exist'
    }));
    return;
  }
  
  const room = rooms.get(roomId);
  room.set(userId, { 
    ws, 
    userName: userName || 'Anonymous',
    userId,
    isPending: true
  });
  ws.userId = userId;
  ws.roomId = roomId;
  ws.userName = userName || 'Anonymous';
  ws.isPending = true;
  
  const owner = Array.from(room.values()).find(user => user.isOwner);
  
  if (owner && owner.ws) {
    owner.ws.send(JSON.stringify({
      type: 'joinRequest',
      userId,
      userName: ws.userName
    }));
    
    ws.send(JSON.stringify({
      type: 'joinRequestPending',
      message: 'Your request to join is pending approval'
    }));
  } else {
    handleAcceptJoinRequest(null, {
      roomId,
      userId,
      userName: ws.userName
    });
  }
}

function handleAcceptJoinRequest(ws, data) {
  const { roomId, userId, userName } = data;
  
  if (!roomId || !userId) {
    log('Invalid accept join request data:', data);
    return;
  }
  
  log(`Accepting join request for user ${userName} (${userId}) in room ${roomId}`);
  
  if (!rooms.has(roomId)) {
    return;
  }
  
  const room = rooms.get(roomId);
  const user = room.get(userId);
  
  if (!user) {
    log(`User ${userId} not found in room ${roomId}`);
    return;
  }
  user.isPending = false;
  if (user.ws) {
    user.ws.isPending = false;
    user.ws.send(JSON.stringify({
      type: 'joinRequestAccepted',
      roomId
    }));
    
    // Notify all users in the room about new connection
    broadcastToRoom(roomId, {
      type: 'userJoined',
      userId,
      userName: user.userName
    });
    const usersList = Array.from(room.values())
      .filter(u => !u.isPending)
      .map(u => u.userName);
    
    user.ws.send(JSON.stringify({
      type: 'usersList',
      users: usersList
    }));
  }
}
function handleRejectJoinRequest(ws, data) {
  const { roomId, userId, userName } = data;
  
  if (!roomId || !userId) {
    log('Invalid reject join request data:', data);
    return;
  }
  
  log(`Rejecting join request for user ${userName} (${userId}) in room ${roomId}`);
  
  if (!rooms.has(roomId)) {
    return;
  }
  
  const room = rooms.get(roomId);
  const user = room.get(userId);
  
  if (!user) {
    log(`User ${userId} not found in room ${roomId}`);
    return;
  }
  
  if (user.ws) {
    user.ws.send(JSON.stringify({
      type: 'joinRequestRejected',
      roomId,
      userId
    }));
  }
  room.delete(userId);
}

function handleGetUsersList(ws, data) {
  const { roomId } = data;
  
  if (!roomId) {
    log('Invalid getUsersList data:', data);
    return;
  }
  
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    const usersList = Array.from(room.values())
      .filter(user => !user.isPending)
      .map(user => user.userName);
    
    log('Sending users list:', usersList);
    
    ws.send(JSON.stringify({
      type: 'usersList',
      users: usersList
    }));
  }
}

function handleDisconnect(ws) {
  const { roomId, userId, userName } = ws;
  
  if (roomId && userId) {
    log(`User ${userName} (${userId}) disconnected from room ${roomId}`);
    
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(userId);
      
      if (room.size === 0) {
        rooms.delete(roomId);
        log(`Room ${roomId} deleted (empty)`);
      } else {
        broadcastToRoom(roomId, {
          type: 'userLeft',
          userId,
          userName: userName || 'Unknown'
        });
      }
    }
  }
}

function broadcastToRoom(roomId, message) {
  if (!rooms.has(roomId)) {
    log(`Cannot broadcast to non-existent room: ${roomId}`);
    return;
  }
  
  const room = rooms.get(roomId);
  log(`Broadcasting ${message.type} to ${room.size} users in room ${roomId}`);
  
  let sentCount = 0;
  for (const user of room.values()) {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(message));
      sentCount++;
    }
  }
  
  log(`Message sent to ${sentCount}/${room.size} users`);
}

module.exports = wss;