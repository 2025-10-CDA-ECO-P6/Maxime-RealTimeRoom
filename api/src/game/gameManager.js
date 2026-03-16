const { randomUUID } = require('node:crypto');
const { createBoard, makeMove, checkWinner, isDraw } = require('./tictactoe.js');

function createGameManager() {
  let waitingSocket = null;
  const games = new Map();       // gameId → GameState
  const socketGameMap = new Map(); // socketId → gameId

  function joinGame(io, socket) {
    if (!waitingSocket) {
      waitingSocket = socket;
      socket.emit('game:waiting', { message: 'En attente d\'un adversaire...' });
    } else {
      const gameId = randomUUID();
      const gameState = {
        board: createBoard(),
        currentPlayer: 'X',
        players: { X: waitingSocket.id, O: socket.id },
        gameId,
      };

      games.set(gameId, gameState);
      socketGameMap.set(waitingSocket.id, gameId);
      socketGameMap.set(socket.id, gameId);

      waitingSocket.join(gameId);
      socket.join(gameId);
      waitingSocket = null;

      io.to(gameId).emit('game:start', {
        board: gameState.board,
        currentPlayer: gameState.currentPlayer,
        players: gameState.players,
        gameId,
      });
    }
  }

  function handleMove(io, socket, { gameId, position }) {
    const game = games.get(gameId);
    if (!game) return;

    const playerMark =
      game.players.X === socket.id ? 'X' :
      game.players.O === socket.id ? 'O' : null;

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

  function handleDisconnect(io, socket) {
    if (waitingSocket && waitingSocket.id === socket.id) {
      waitingSocket = null;
      return;
    }

    const gameId = socketGameMap.get(socket.id);
    if (!gameId) return;

    const game = games.get(gameId);
    if (!game) return;

    io.to(gameId).emit('game:over', { winner: null, reason: 'opponent-left' });

    socketGameMap.delete(game.players.X);
    socketGameMap.delete(game.players.O);
    games.delete(gameId);
  }

  function getWaitingPlayer() {
    return waitingSocket ? waitingSocket.id : null;
  }

  function getGame(gameId) {
    return games.get(gameId);
  }

  return { joinGame, handleMove, handleReset, handleDisconnect, getWaitingPlayer, getGame };
}

module.exports = { createGameManager };
