const { randomUUID } = require('node:crypto');
const {
  createBoard,
  makeMove,
  checkWinner,
  isDraw,
} = require('./tictactoe.js');

function createGameManager(walletManager = null) {
  const waitingQueue = [];
  const games = new Map();
  const socketGameMap = new Map();

  function joinGame(io, socket) {
    if (waitingQueue.some((s) => s.id === socket.id)) return;
    if (socketGameMap.has(socket.id)) return;

    waitingQueue.push(socket);

    if (waitingQueue.length < 2) {
      socket.emit('game:waiting', { message: "En attente d'un adversaire..." });
      return;
    }

    const socketX = waitingQueue.shift();
    const socketO = waitingQueue.shift();

    const gameId = randomUUID();
    const gameState = {
      board: createBoard(),
      currentPlayer: 'X',
      players: { X: socketX.id, O: socketO.id },
      gameId,
    };

    games.set(gameId, gameState);
    socketGameMap.set(socketX.id, gameId);
    socketGameMap.set(socketO.id, gameId);

    socketX.join(gameId);
    socketO.join(gameId);

    io.to(gameId).emit('game:start', {
      board: gameState.board,
      currentPlayer: gameState.currentPlayer,
      players: gameState.players,
      gameId,
    });
  }

  function handleMove(io, socket, { gameId, position }) {
    const game = games.get(gameId);
    if (!game) return;

    const playerMark =
      game.players.X === socket.id
        ? 'X'
        : game.players.O === socket.id
          ? 'O'
          : null;

    if (!playerMark || playerMark !== game.currentPlayer) return;

    try {
      game.board = makeMove(game.board, position, playerMark);
    } catch {
      return;
    }

    const winner = checkWinner(game.board);
    const draw = isDraw(game.board);

    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

    io.to(gameId).emit('game:update', {
      board: game.board,
      currentPlayer: game.currentPlayer,
      winner,
      isDraw: draw,
    });

    if (winner || draw) {
      io.to(gameId).emit('game:over', { winner, isDraw: draw });

      // Créditer les pièces
      if (walletManager) {
        if (draw) {
          // Nul : +3 pour les deux
          walletManager.credit(game.players.X, 3);
          walletManager.credit(game.players.O, 3);
          io.to(game.players.X).emit('wallet:update', { balance: walletManager.getBalance(game.players.X), delta: 3, isGameResult: true });
          io.to(game.players.O).emit('wallet:update', { balance: walletManager.getBalance(game.players.O), delta: 3, isGameResult: true });
        } else if (winner) {
          // Victoire : +10 pour le gagnant uniquement (perdant : rien à afficher)
          const winnerSocketId = game.players[winner];
          walletManager.credit(winnerSocketId, 10);
          io.to(winnerSocketId).emit('wallet:update', { balance: walletManager.getBalance(winnerSocketId), delta: 10, isGameResult: true });
        }
      }
    }
  }

  function handleReset(io, socket, { gameId }) {
    const game = games.get(gameId);
    if (!game) return;

    game.board = createBoard();
    game.currentPlayer = 'X';

    io.to(gameId).emit('game:start', {
      board: game.board,
      currentPlayer: game.currentPlayer,
      players: game.players,
      gameId,
    });
  }

  function handleLeaveGame(io, socket, options = {}) {
    const queueIndex = waitingQueue.findIndex((s) => s.id === socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
      return;
    }

    const gameId = (options && options.gameId) || socketGameMap.get(socket.id);
    const game = games.get(gameId);
    if (!game) return;

    io.to(gameId).emit('game:over', { winner: null, reason: 'opponent-left' });

    socketGameMap.delete(game.players.X);
    socketGameMap.delete(game.players.O);
    games.delete(gameId);
  }

  function handleDisconnect(io, socket) {
    handleLeaveGame(io, socket);
  }

  function getWaitingPlayer() {
    return waitingQueue.length > 0 ? waitingQueue[0].id : null;
  }

  function getGame(gameId) {
    return games.get(gameId);
  }

  return {
    joinGame,
    handleMove,
    handleReset,
    handleLeaveGame,
    handleDisconnect,
    getWaitingPlayer,
    getGame,
  };
}

module.exports = { createGameManager };
