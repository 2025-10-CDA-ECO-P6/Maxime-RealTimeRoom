const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { createGameManager } = require('./src/game/gameManager.js');
const { createBlackjackManager } = require('./src/game/blackjackManager.js');

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

const ticTacToeManager = createGameManager();
const blackjackManager = createBlackjackManager();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Routing par gameType
  socket.on('game:join', (data = {}) => {
    const { gameType = 'tictactoe' } = data;
    if (gameType === 'blackjack') blackjackManager.joinGame(io, socket);
    else ticTacToeManager.joinGame(io, socket);
  });

  // Démarrage d'un round Blackjack
  socket.on('game:start-round', (data) => blackjackManager.startRound(io, socket, data));

  // Actions Blackjack : hit / stand / double / split
  socket.on('game:action', (data) => blackjackManager.handleAction(io, socket, data));

  // Tic-Tac-Toe (inchangé)
  socket.on('game:move',  (data) => ticTacToeManager.handleMove(io, socket, data));
  socket.on('game:reset', (data) => ticTacToeManager.handleReset(io, socket, data));

  // Leave : route par gameType
  socket.on('game:leave', (data = {}) => {
    if (data.gameType === 'blackjack') blackjackManager.handleLeaveGame(io, socket, data);
    else ticTacToeManager.handleLeaveGame(io, socket, data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    ticTacToeManager.handleDisconnect(io, socket);
    blackjackManager.handleDisconnect(io, socket);
  });
});

server.listen(3000, () => {
  console.log('server running at ', server.address().port);
});
