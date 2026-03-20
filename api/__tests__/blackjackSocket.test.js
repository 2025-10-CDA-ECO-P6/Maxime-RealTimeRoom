/**
 * Tests RED — Intégration socket Blackjack
 *
 * Teste le blackjackManager avec des mocks socket/io.
 * Pas de vrai serveur : on vérifie que les bons événements sont émis.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createBlackjackManager } from '../src/game/blackjackManager.js';

/**
 * Deck déterministe pour les tests : commence avec des petites cartes,
 * sans As aux positions 0-7 → impossible d'avoir un Blackjack naturel dès la donne.
 * Distribution : joueur1→(2♥,4♥), dealer→(3♥,5♥)
 */
function safeDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  for (const suit of suits) for (const rank of ranks) deck.push({ suit, rank });
  return deck; // ordonné : commence par 2♥, pas d'As avant la 13ème carte
}

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

/** Récupère le gameId depuis le 1er emit game:waiting (maintenant via io._roomEmit) */
function getGameId(io) {
  const call = io._roomEmit.mock.calls.find(([ev]) => ev === 'game:waiting');
  return call[1].gameId;
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

    // game:waiting est maintenant broadcasté via io.to(gameId).emit
    expect(io._roomEmit).toHaveBeenCalledWith('game:waiting', expect.any(Object));
    expect(manager.getRoom(expect.anything())).toBeDefined;
  });

  test('2ème joueur rejoint : tous reçoivent game:waiting avec 2 joueurs', () => {
    manager.joinGame(io, socket1);
    manager.joinGame(io, socket2);

    // Le 2ème emit game:waiting doit indiquer playerCount: 2
    const waitingCalls = io._roomEmit.mock.calls.filter(([ev]) => ev === 'game:waiting');
    const last = waitingCalls[waitingCalls.length - 1][1];
    expect(last.playerCount).toBe(2);
    expect(last.players).toHaveLength(2);
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
    const gameId = getGameId(io);

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.startRound(io, socket1, { gameId, _testDeck: safeDeck() });

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
    const gameId = getGameId(io);

    manager.startRound(io, socket1, { gameId, _testDeck: safeDeck() });

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
    const gameId = getGameId(io);
    manager.startRound(io, socket1, { gameId, _testDeck: safeDeck() });

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
    const gameId = getGameId(io);
    manager.startRound(io, socket1, { gameId, _testDeck: safeDeck() });

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
    const gameId = getGameId(io);
    manager.startRound(io, socket1, { gameId, _testDeck: safeDeck() });
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
    const gameId = getGameId(io);
    manager.startRound(io, socket1, { gameId, _testDeck: safeDeck() });

    io._roomEmit.mockClear();
    io.to.mockClear();

    manager.handleAction(io, intruder, { gameId, action: 'hit' });

    expect(io._roomEmit).not.toHaveBeenCalled();
  });
});
