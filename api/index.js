const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { createGameManager } = require('./src/game/gameManager.js');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://web-9h33.onrender.com'],
  },
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'web', 'index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const gameManager = createGameManager();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('game:join',  ()     => gameManager.joinGame(io, socket));
  socket.on('game:move',  (data) => gameManager.handleMove(io, socket, data));
  socket.on('game:reset', (data) => gameManager.handleReset(io, socket, data));
  socket.on('game:leave', (data) => gameManager.handleLeaveGame(io, socket, data));

  socket.on('disconnect', () => {
    console.log('user disconnected');
    gameManager.handleDisconnect(io, socket);
  });
});
server.listen(3000, () => {
  console.log('server running at ', server.address().port);
});
