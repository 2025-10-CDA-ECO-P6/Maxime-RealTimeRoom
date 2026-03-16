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
});

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

    // Récupérer le gameId depuis l'appel à io.to()
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
    // Jouer avec le joueur dont ce n'est PAS le tour
    const wrongPlayerSocketId =
      game.currentPlayer === 'X' ? game.players.O : game.players.X;
    const wrongSocket = wrongPlayerSocketId === 'player-1' ? socket1 : socket2;

    manager.handleMove(io, wrongSocket, { gameId, position: 4 });

    expect(io._roomEmit).not.toHaveBeenCalled();
  });

  test('un coup gagnant émet game:over avec le vainqueur', () => {
    // Forcer un état presque gagnant pour X
    const game = manager.getGame(gameId);
    const xSocketId = game.players.X;
    const xSocket = xSocketId === 'player-1' ? socket1 : socket2;
    const oSocketId = game.players.O;
    const oSocket = oSocketId === 'player-1' ? socket1 : socket2;

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
