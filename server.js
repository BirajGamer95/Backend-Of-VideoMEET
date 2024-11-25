import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

const rooms = new Map();

app.get('/', (req, res) => {
  res.send('Video Call Server is running');
});

app.get('/create-room', (req, res) => {
  const roomId = uuidv4();
  rooms.set(roomId, { users: new Set() });
  res.json({ roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-room', (roomId, userId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.users.add(userId);
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);
      
      socket.on('disconnect', () => {
        room.users.delete(userId);
        socket.to(roomId).emit('user-disconnected', userId);
      });
    }
  });

  socket.on('offer', (offer, roomId, userId) => {
    socket.to(roomId).emit('offer', offer, userId);
  });

  socket.on('answer', (answer, roomId, userId) => {
    socket.to(roomId).emit('answer', answer, userId);
  });

  socket.on('ice-candidate', (candidate, roomId, userId) => {
    socket.to(roomId).emit('ice-candidate', candidate, userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Log active rooms every 5 minutes
setInterval(() => {
  console.log('Active rooms:');
  for (const [roomId, room] of rooms.entries()) {
    console.log(`Room ${roomId}: ${room.users.size} users`);
  }
}, 5 * 60 * 1000);
