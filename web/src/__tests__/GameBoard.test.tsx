import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameBoard } from '../components/game/GameBoard';

describe('GameBoard', () => {
  const emptyBoard = Array(9).fill(null);

  test('rend 9 cellules (boutons)', () => {
    render(
      <GameBoard
        board={emptyBoard}
        onCellClick={() => {}}
        disabled={false}
        winningCells={[]}
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(9);
  });

  test('affiche X et O dans les bonnes cases', () => {
    const board = ['X', null, 'O', ...Array(6).fill(null)];
    render(
      <GameBoard
        board={board}
        onCellClick={() => {}}
        disabled={false}
        winningCells={[]}
      />
    );
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('O')).toBeInTheDocument();
  });

  test('appelle onCellClick avec le bon index au clic sur une case vide', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GameBoard
        board={emptyBoard}
        onCellClick={onClick}
        disabled={false}
        winningCells={[]}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[4]);
    expect(onClick).toHaveBeenCalledWith(4);
  });

  test('ne déclenche pas onCellClick si disabled est true', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GameBoard
        board={emptyBoard}
        onCellClick={onClick}
        disabled={true}
        winningCells={[]}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('applique la classe game-cell--winning sur les cases gagnantes', () => {
    const board = ['X', 'X', 'X', ...Array(6).fill(null)];
    const { container } = render(
      <GameBoard
        board={board}
        onCellClick={() => {}}
        disabled={false}
        winningCells={[0, 1, 2]}
      />
    );

    const winningButtons = container.querySelectorAll('.game-cell--winning');
    expect(winningButtons).toHaveLength(3);
  });
});
