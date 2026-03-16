import { describe, test, expect } from 'vitest';
import {
  createBoard,
  isValidMove,
  makeMove,
  checkWinner,
  isDraw,
} from '../src/game/tictactoe.js';

describe('createBoard', () => {
  test('retourne un tableau de 9 valeurs null', () => {
    const board = createBoard();
    expect(board).toHaveLength(9);
    expect(board.every((cell) => cell === null)).toBe(true);
  });
});

describe('isValidMove', () => {
  test('retourne true pour une case vide dans les limites', () => {
    const board = createBoard();
    expect(isValidMove(board, 4)).toBe(true);
  });

  test('retourne false si la case est déjà occupée', () => {
    const board = createBoard();
    board[0] = 'X';
    expect(isValidMove(board, 0)).toBe(false);
  });

  test('retourne false si la position est hors limites (> 8)', () => {
    const board = createBoard();
    expect(isValidMove(board, 9)).toBe(false);
  });

  test('retourne false si la position est hors limites (< 0)', () => {
    const board = createBoard();
    expect(isValidMove(board, -1)).toBe(false);
  });
});

describe('makeMove', () => {
  test('place le symbole du joueur à la position donnée', () => {
    const board = createBoard();
    const result = makeMove(board, 0, 'X');
    expect(result[0]).toBe('X');
  });

  test('ne mute pas le plateau original', () => {
    const board = createBoard();
    makeMove(board, 0, 'X');
    expect(board[0]).toBeNull();
  });

  test('throw si la case est déjà occupée', () => {
    const board = createBoard();
    board[0] = 'O';
    expect(() => makeMove(board, 0, 'X')).toThrow();
  });

  test('throw si la position est invalide', () => {
    const board = createBoard();
    expect(() => makeMove(board, 10, 'X')).toThrow();
  });
});

describe('checkWinner', () => {
  test('retourne null si aucun vainqueur', () => {
    const board = createBoard();
    expect(checkWinner(board)).toBeNull();
  });

  test('détecte une victoire horizontale pour X (ligne 0)', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(checkWinner(board)).toBe('X');
  });

  test('détecte une victoire horizontale pour O (ligne 1)', () => {
    const board = [null, null, null, 'O', 'O', 'O', null, null, null];
    expect(checkWinner(board)).toBe('O');
  });

  test('détecte une victoire verticale pour X (colonne 0)', () => {
    const board = ['X', null, null, 'X', null, null, 'X', null, null];
    expect(checkWinner(board)).toBe('X');
  });

  test('détecte une victoire diagonale pour O (positions 2,4,6)', () => {
    const board = [null, null, 'O', null, 'O', null, 'O', null, null];
    expect(checkWinner(board)).toBe('O');
  });

  test('détecte une victoire diagonale principale pour X (positions 0,4,8)', () => {
    const board = ['X', null, null, null, 'X', null, null, null, 'X'];
    expect(checkWinner(board)).toBe('X');
  });
});

describe('isDraw', () => {
  test('retourne true si le plateau est plein sans vainqueur', () => {
    // X O X | X O O | O X X → pas de vainqueur, plateau plein
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(isDraw(board)).toBe(true);
  });

  test('retourne false si le plateau a des cases vides', () => {
    const board = createBoard();
    expect(isDraw(board)).toBe(false);
  });

  test('retourne false si le plateau est plein mais qu\'il y a un vainqueur', () => {
    // Plateau plein avec vainqueur
    const board = ['X', 'X', 'X', 'O', 'O', 'X', 'O', 'X', 'O'];
    expect(isDraw(board)).toBe(false);
  });
});
