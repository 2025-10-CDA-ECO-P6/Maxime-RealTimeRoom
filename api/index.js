const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { createGameManager } = require('./src/game/gameManager.js');
const { createBlackjackManager } = require('./src/game/blackjackManager.js');
const { createWalletManager } = require('./src/game/walletManager.js');

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

const walletManager = createWalletManager();
const ticTacToeManager = createGameManager(walletManager);
const blackjackManager = createBlackjackManager(walletManager);

io.on('connection', (socket) => {
  console.log('a user connected');

  // Initialiser le wallet et envoyer le solde au client
  walletManager.init(socket.id);
  socket.emit('wallet:update', { balance: walletManager.getBalance(socket.id), delta: 0 });

  // Permet au client de re-demander son solde à tout moment
  socket.on('wallet:get', () => {
    const balance = walletManager.getBalance(socket.id);
    if (balance !== null) socket.emit('wallet:update', { balance, delta: 0 });
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Routing par gameType
  socket.on('game:join', (data = {}) => {
    const { gameType = 'tictactoe' } = data;
    if (gameType === 'blackjack') blackjackManager.joinGame(io, socket);
    else ticTacToeManager.joinGame(io, socket);
  });

  // Démarrage d'un round Blackjack (direct — rétro-compat)
  socket.on('game:start-round', (data) => blackjackManager.startRound(io, socket, data));

  // Joueur prêt avec sa mise → auto-démarre quand tous prêts
  socket.on('game:ready', (data) => blackjackManager.handleReady(io, socket, data));

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
    walletManager.remove(socket.id);
  });
});

server.listen(3000, () => {
  console.log('server running at ', server.address().port);
});
