import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createGameManager } from '../src/game/gameManager.js';

function createMockSocket(id) {
  return {
    id,
    emit: vi.fn(),
    join: vi.fn(),
  };
}

function createMockIo() {
  const roomEmit = vi.fn();
  return {
    to: vi.fn(() => ({ emit: roomEmit })),
    _roomEmit: roomEmit,
  };
}

// ─────────────────────────────────────────────
// game:join — matchmaking
// ─────────────────────────────────────────────
describe('game:join', () => {
  let manager;

  beforeEach(() => {
    manager = createGameManager();
  });

  test('le 1er joueur reçoit game:waiting et est mis en file d\'attente', () => {
    const io = createMockIo();
    const socket = createMockSocket('player-1');

    manager.joinGame(io, socket);

    expect(socket.emit).toHaveBeenCalledWith('game:waiting', expect.any(Object));
    expect(manager.getWaitingPlayer()).toBe('player-1');
  });

  test('le 2ème joueur déclenche game:start pour les deux, file vidée', () => {
    const io = createMockIo();
    const socket1 = createMockSocket('player-1');
    const socket2 = createMockSocket('player-2');

    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    expect(io.to).toHaveBeenCalled();
    expect(io._roomEmit).toHaveBeenCalledWith(
      'game:start',
      expect.objectContaining({
        board: expect.arrayContaining([null]),
        currentPlayer: expect.stringMatching(/^[XO]$/),
        players: expect.objectContaining({ X: expect.any(String), O: expect.any(String) }),
      })
    );
    expect(manager.getWaitingPlayer()).toBeNull();
  });

  test('un 3ème joueur attend pendant que la 1ère partie est en cours', () => {
    const io = createMockIo();
    const socket1 = createMockSocket('player-1');
    const socket2 = createMockSocket('player-2');
    const socket3 = createMockSocket('player-3');

    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2); // partie 1 lancée
    manager.joinGame(io, socket3); // doit attendre

    expect(socket3.emit).toHaveBeenCalledWith('game:waiting', expect.any(Object));
    expect(manager.getWaitingPlayer()).toBe('player-3');
  });

  test('un joueur déjà en file ne peut pas rejoindre deux fois', () => {
    const io = createMockIo();
    const socket = createMockSocket('player-1');

    manager.joinGame(io, socket);
    manager.joinGame(io, socket); // deuxième tentative

    // game:waiting émis une seule fois
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(manager.getWaitingPlayer()).toBe('player-1');
  });
});

// ─────────────────────────────────────────────
// game:move
// ─────────────────────────────────────────────
describe('game:move', () => {
  let manager;
  let io;
  let socket1;
  let socket2;
  let gameId;

  beforeEach(() => {
    manager = createGameManager();
    io = createMockIo();
    socket1 = createMockSocket('player-1');
    socket2 = createMockSocket('player-2');

    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    gameId = io.to.mock.calls[0][0];
  });

  test('un coup valide émet game:update avec le nouveau board', () => {
    io._roomEmit.mockClear();
    io.to.mockClear();

    const game = manager.getGame(gameId);
    const currentPlayerSocketId =
      game.currentPlayer === 'X' ? game.players.X : game.players.O;
    const currentSocket = currentPlayerSocketId === 'player-1' ? socket1 : socket2;

    manager.handleMove(io, currentSocket, { gameId, position: 0 });

    expect(io.to).toHaveBeenCalledWith(gameId);
    expect(io._roomEmit).toHaveBeenCalledWith(
      'game:update',
      expect.objectContaining({ board: expect.any(Array) })
    );
  });

  test('un coup du mauvais joueur est ignoré (aucun emit)', () => {
    io._roomEmit.mockClear();
    io.to.mockClear();

    const game = manager.getGame(gameId);
    const wrongPlayerSocketId =
      game.currentPlayer === 'X' ? game.players.O : game.players.X;
    const wrongSocket = wrongPlayerSocketId === 'player-1' ? socket1 : socket2;

    manager.handleMove(io, wrongSocket, { gameId, position: 4 });

    expect(io._roomEmit).not.toHaveBeenCalled();
  });

  test('un coup gagnant émet game:over avec le vainqueur', () => {
    const game = manager.getGame(gameId);
    const xSocketId = game.players.X;
    const xSocket = xSocketId === 'player-1' ? socket1 : socket2;

    // X: 0,1 | O: 3,4 → X joue 2 → victoire
    game.board[0] = 'X';
    game.board[1] = 'X';
    game.board[3] = 'O';
    game.board[4] = 'O';
    game.currentPlayer = 'X';

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleMove(io, xSocket, { gameId, position: 2 });

    const calls = io._roomEmit.mock.calls;
    const gameOverCall = calls.find(([event]) => event === 'game:over');
    expect(gameOverCall).toBeDefined();
    expect(gameOverCall[1]).toMatchObject({ winner: 'X' });
  });
});

// ─────────────────────────────────────────────
// game:reset
// ─────────────────────────────────────────────
describe('game:reset', () => {
  test('reset remet le plateau à zéro et réémet game:start', () => {
    const manager = createGameManager();
    const io = createMockIo();
    const socket1 = createMockSocket('player-1');
    const socket2 = createMockSocket('player-2');

    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    const gameId = io.to.mock.calls[0][0];

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleReset(io, socket1, { gameId });

    expect(io._roomEmit).toHaveBeenCalledWith(
      'game:start',
      expect.objectContaining({
        board: expect.arrayContaining([null]),
      })
    );

    const game = manager.getGame(gameId);
    expect(game.board.every((c) => c === null)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// game:leave
// ─────────────────────────────────────────────
describe('game:leave', () => {
  test('quitter la file d\'attente retire le joueur de la queue', () => {
    const manager = createGameManager();
    const io = createMockIo();
    const socket = createMockSocket('player-1');

    manager.joinGame(io, socket);
    expect(manager.getWaitingPlayer()).toBe('player-1');

    manager.handleLeaveGame(io, socket, {});
    expect(manager.getWaitingPlayer()).toBeNull();
  });

  test('quitter une partie en cours notifie tous les joueurs et nettoie l\'état', () => {
    const manager = createGameManager();
    const io = createMockIo();
    const socket1 = createMockSocket('player-1');
    const socket2 = createMockSocket('player-2');

    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    const gameId = io.to.mock.calls[0][0];

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleLeaveGame(io, socket1, { gameId });

    expect(io._roomEmit).toHaveBeenCalledWith(
      'game:over',
      expect.objectContaining({ reason: 'opponent-left' })
    );
    expect(manager.getGame(gameId)).toBeUndefined();
  });

  test('déconnexion en cours de partie notifie l\'adversaire', () => {
    const manager = createGameManager();
    const io = createMockIo();
    const socket1 = createMockSocket('player-1');
    const socket2 = createMockSocket('player-2');

    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    const gameId = io.to.mock.calls[0][0];

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleDisconnect(io, socket2); // équivalent à une déconnexion réseau

    expect(io._roomEmit).toHaveBeenCalledWith(
      'game:over',
      expect.objectContaining({ reason: 'opponent-left' })
    );
    expect(manager.getGame(gameId)).toBeUndefined();
  });
});
