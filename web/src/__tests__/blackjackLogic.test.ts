/**
 * Tests RED — Helpers frontend Blackjack
 *
 * Fonctions pures pour dériver la phase UI depuis l'état de jeu,
 * et pour afficher les cartes (symboles, dos caché).
 */
import { describe, test, expect } from 'vitest';
import {
  getCardDisplay,
  getSuitSymbol,
  getBlackjackPhase,
  isMyTurn,
} from '../utils/blackjackLogic';
import type { BJGameState, BJCard } from '../types/blackjack';

// ─────────────────────────────────────────────────────────────────────────────
// Affichage des cartes
// ─────────────────────────────────────────────────────────────────────────────
describe('getSuitSymbol', () => {
  test('spades → ♠', () => expect(getSuitSymbol('spades')).toBe('♠'));
  test('hearts → ♥', () => expect(getSuitSymbol('hearts')).toBe('♥'));
  test('diamonds → ♦', () => expect(getSuitSymbol('diamonds')).toBe('♦'));
  test('clubs → ♣', () => expect(getSuitSymbol('clubs')).toBe('♣'));
});

describe('getCardDisplay', () => {
  test('carte visible → "♠A"', () => {
    const c: BJCard = { suit: 'spades', rank: 'A' };
    expect(getCardDisplay(c)).toBe('♠A');
  });

  test('carte visible → "♥K"', () => {
    const c: BJCard = { suit: 'hearts', rank: 'K' };
    expect(getCardDisplay(c)).toBe('♥K');
  });

  test('carte cachée (hidden: true) → "🂠"', () => {
    const c: BJCard = { suit: 'spades', rank: 'A', hidden: true };
    expect(getCardDisplay(c)).toBe('🂠');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase de jeu dérivée
// ─────────────────────────────────────────────────────────────────────────────
describe('getBlackjackPhase', () => {
  test('state null → "idle"', () => {
    expect(getBlackjackPhase(null, 'socket-1')).toBe('idle');
  });

  test('phase waiting → "waiting"', () => {
    const state: Partial<BJGameState> = { phase: 'waiting' };
    expect(getBlackjackPhase(state as BJGameState, 'socket-1')).toBe('waiting');
  });

  test('phase playing, c\'est mon tour → "my-turn"', () => {
    const state: Partial<BJGameState> = {
      phase: 'playing',
      currentPlayerIndex: 0,
      players: [
        { socketId: 'socket-1', hands: [], currentHandIndex: 0, result: null },
        { socketId: 'socket-2', hands: [], currentHandIndex: 0, result: null },
      ],
    };
    expect(getBlackjackPhase(state as BJGameState, 'socket-1')).toBe('my-turn');
  });

  test('phase playing, c\'est le tour d\'un autre → "waiting-turn"', () => {
    const state: Partial<BJGameState> = {
      phase: 'playing',
      currentPlayerIndex: 1,
      players: [
        { socketId: 'socket-1', hands: [], currentHandIndex: 0, result: null },
        { socketId: 'socket-2', hands: [], currentHandIndex: 0, result: null },
      ],
    };
    expect(getBlackjackPhase(state as BJGameState, 'socket-1')).toBe('waiting-turn');
  });

  test('phase dealer-turn → "dealer-turn"', () => {
    const state: Partial<BJGameState> = { phase: 'dealer-turn' };
    expect(getBlackjackPhase(state as BJGameState, 'socket-1')).toBe('dealer-turn');
  });

  test('phase over → "over"', () => {
    const state: Partial<BJGameState> = { phase: 'over' };
    expect(getBlackjackPhase(state as BJGameState, 'socket-1')).toBe('over');
  });
});

describe('isMyTurn', () => {
  test('retourne true quand c\'est mon tour', () => {
    const state: Partial<BJGameState> = {
      phase: 'playing',
      currentPlayerIndex: 0,
      players: [{ socketId: 'socket-1', hands: [], currentHandIndex: 0, result: null }],
    };
    expect(isMyTurn(state as BJGameState, 'socket-1')).toBe(true);
  });

  test('retourne false quand ce n\'est pas mon tour', () => {
    const state: Partial<BJGameState> = {
      phase: 'playing',
      currentPlayerIndex: 1,
      players: [
        { socketId: 'socket-1', hands: [], currentHandIndex: 0, result: null },
        { socketId: 'socket-2', hands: [], currentHandIndex: 0, result: null },
      ],
    };
    expect(isMyTurn(state as BJGameState, 'socket-1')).toBe(false);
  });
});
