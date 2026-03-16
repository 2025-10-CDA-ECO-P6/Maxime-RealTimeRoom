import { describe, test, expect } from 'vitest';
import { getGamePhase, isMyTurn, getWinningCells } from '../utils/gameLogic';
import type { GameState } from '../types/game';

describe('getGamePhase', () => {
  test('retourne "idle" quand gameState est null', () => {
    expect(getGamePhase(null, 'socket-1')).toBe('idle');
  });

  test('retourne "waiting" quand phase est waiting', () => {
    const state: Partial<GameState> = { phase: 'waiting' };
    expect(getGamePhase(state as GameState, 'socket-1')).toBe('waiting');
  });

  test('retourne "playing-your-turn" quand c\'est le tour du joueur local', () => {
    const state: GameState = {
      phase: 'playing',
      board: Array(9).fill(null),
      currentPlayer: 'X',
      players: { X: 'my-id', O: 'opp-id' },
      gameId: 'game-1',
    };
    expect(getGamePhase(state, 'my-id')).toBe('playing-your-turn');
  });

  test('retourne "playing-opponent-turn" quand c\'est le tour de l\'adversaire', () => {
    const state: GameState = {
      phase: 'playing',
      board: Array(9).fill(null),
      currentPlayer: 'X',
      players: { X: 'opp-id', O: 'my-id' },
      gameId: 'game-1',
    };
    expect(getGamePhase(state, 'my-id')).toBe('playing-opponent-turn');
  });
});

describe('isMyTurn', () => {
  test('retourne true quand c\'est le tour du joueur local', () => {
    const state: GameState = {
      phase: 'playing',
      board: Array(9).fill(null),
      currentPlayer: 'O',
      players: { X: 'opp-id', O: 'my-id' },
      gameId: 'game-1',
    };
    expect(isMyTurn(state, 'my-id')).toBe(true);
  });

  test('retourne false quand c\'est le tour de l\'adversaire', () => {
    const state: GameState = {
      phase: 'playing',
      board: Array(9).fill(null),
      currentPlayer: 'X',
      players: { X: 'opp-id', O: 'my-id' },
      gameId: 'game-1',
    };
    expect(isMyTurn(state, 'my-id')).toBe(false);
  });
});

describe('getWinningCells', () => {
  test('retourne [0,1,2] pour une victoire horizontale X en ligne 0', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(getWinningCells(board, 'X')).toEqual([0, 1, 2]);
  });

  test('retourne [] si aucun vainqueur', () => {
    const board = Array(9).fill(null);
    expect(getWinningCells(board, 'X')).toEqual([]);
  });
});
