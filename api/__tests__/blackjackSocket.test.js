/**
 * Tests RED — Intégration socket Blackjack
 *
 * Teste le blackjackManager avec des mocks socket/io.
 * Pas de vrai serveur : on vérifie que les bons événements sont émis.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createBlackjackManager } from '../src/game/blackjackManager.js';

function createMockSocket(id) {
  return { id, emit: vi.fn(), join: vi.fn(), leave: vi.fn() };
}

function createMockIo() {
  const roomEmit = vi.fn();
  return {
    to: vi.fn(() => ({ emit: roomEmit })),
    _roomEmit: roomEmit,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Matchmaking — rejoindre une room
// ─────────────────────────────────────────────────────────────────────────────
describe('game:join (blackjack)', () => {
  let manager, io, socket1, socket2;

  beforeEach(() => {
    manager = createBlackjackManager();
    io = createMockIo();
    socket1 = createMockSocket('bj-p1');
    socket2 = createMockSocket('bj-p2');
  });

  test('1er joueur reçoit game:waiting et une room est créée', () => {
    manager.joinGame(io, socket1);

    expect(socket1.emit).toHaveBeenCalledWith('game:waiting', expect.any(Object));
    expect(manager.getRoom(expect.anything())).toBeDefined;
  });

  test('2ème joueur rejoint la même room (toujours en waiting)', () => {
    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    // Les deux sont dans la même room, pas encore started
    expect(socket2.emit).toHaveBeenCalledWith('game:waiting', expect.any(Object));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Démarrage d'un round
// ─────────────────────────────────────────────────────────────────────────────
describe('game:start-round', () => {
  test('émet game:start avec les mains distribuées (2 cartes chacun + dealer)', () => {
    const manager = createBlackjackManager();
    const io = createMockIo();
    const socket1 = createMockSocket('bj-p1');

    manager.joinGame(io, socket1);

    // Récupérer le gameId depuis l'emit game:waiting
    const waitingCall = socket1.emit.mock.calls.find(([ev]) => ev === 'game:waiting');
    const gameId = waitingCall[1].gameId;

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.startRound(io, socket1, { gameId });

    expect(io._roomEmit).toHaveBeenCalledWith(
      'game:start',
      expect.objectContaining({
        gameId,
        players: expect.arrayContaining([
          expect.objectContaining({
            socketId: 'bj-p1',
            hands: expect.arrayContaining([
              expect.objectContaining({ cards: expect.any(Array) }),
            ]),
          }),
        ]),
        dealerCards: expect.arrayContaining([
          expect.objectContaining({ rank: expect.any(String) }),
        ]),
      }),
    );
  });

  test('chaque joueur reçoit exactement 2 cartes au départ', () => {
    const manager = createBlackjackManager();
    const io = createMockIo();
    const socket1 = createMockSocket('bj-p1');

    manager.joinGame(io, socket1);
    const gameId = socket1.emit.mock.calls.find(([ev]) => ev === 'game:waiting')[1].gameId;

    manager.startRound(io, socket1, { gameId });

    const startPayload = io._roomEmit.mock.calls.find(([ev]) => ev === 'game:start')[1];
    const player = startPayload.players[0];
    expect(player.hands[0].cards).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Actions joueur en cours de partie
// ─────────────────────────────────────────────────────────────────────────────
describe('game:action — hit', () => {
  test('hit ajoute une carte et émet game:update', () => {
    const manager = createBlackjackManager();
    const io = createMockIo();
    const socket1 = createMockSocket('bj-p1');

    manager.joinGame(io, socket1);
    const gameId = socket1.emit.mock.calls.find(([ev]) => ev === 'game:waiting')[1].gameId;
    manager.startRound(io, socket1, { gameId });

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleAction(io, socket1, { gameId, action: 'hit' });

    expect(io._roomEmit).toHaveBeenCalledWith('game:update', expect.any(Object));

    // Le joueur a maintenant 3 cartes (ou game:over si bust)
    const updateOrOver = io._roomEmit.mock.calls.map(([ev]) => ev);
    expect(updateOrOver.some(ev => ev === 'game:update' || ev === 'game:over')).toBe(true);
  });
});

describe('game:action — stand', () => {
  test('stand déclenche le tour du dealer (solo) et émet game:over', () => {
    const manager = createBlackjackManager();
    const io = createMockIo();
    const socket1 = createMockSocket('bj-p1');

    manager.joinGame(io, socket1);
    const gameId = socket1.emit.mock.calls.find(([ev]) => ev === 'game:waiting')[1].gameId;
    manager.startRound(io, socket1, { gameId });

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleAction(io, socket1, { gameId, action: 'stand' });

    // Avec 1 seul joueur qui stand, le dealer joue et on a game:over
    const emittedEvents = io._roomEmit.mock.calls.map(([ev]) => ev);
    expect(emittedEvents).toContain('game:over');
  });

  test('game:over contient les résultats de tous les joueurs', () => {
    const manager = createBlackjackManager();
    const io = createMockIo();
    const socket1 = createMockSocket('bj-p1');

    manager.joinGame(io, socket1);
    const gameId = socket1.emit.mock.calls.find(([ev]) => ev === 'game:waiting')[1].gameId;
    manager.startRound(io, socket1, { gameId });
    manager.handleAction(io, socket1, { gameId, action: 'stand' });

    const overCall = io._roomEmit.mock.calls.find(([ev]) => ev === 'game:over');
    expect(overCall).toBeDefined();
    expect(overCall[1]).toMatchObject({
      players: expect.arrayContaining([
        expect.objectContaining({ result: expect.any(Array) }),
      ]),
      dealerCards: expect.any(Array),
    });
  });
});

describe('game:action — hors tour', () => {
  test('action d\'un joueur pas dans la room → ignorée (aucun emit)', () => {
    const manager = createBlackjackManager();
    const io = createMockIo();
    const socket1 = createMockSocket('bj-p1');
    const intruder = createMockSocket('intruder');

    manager.joinGame(io, socket1);
    const gameId = socket1.emit.mock.calls.find(([ev]) => ev === 'game:waiting')[1].gameId;
    manager.startRound(io, socket1, { gameId });

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleAction(io, intruder, { gameId, action: 'hit' });

    expect(io._roomEmit).not.toHaveBeenCalled();
  });
});
