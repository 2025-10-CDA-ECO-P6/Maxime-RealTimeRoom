import { GameCell } from './GameCell';

interface GameBoardProps {
  board: (string | null)[];
  onCellClick: (index: number) => void;
  disabled: boolean;
  winningCells: number[];
}

export function GameBoard({ board, onCellClick, disabled, winningCells }: GameBoardProps) {
  return (
    <div className="game-board">
      {board.map((cell, index) => (
        <GameCell
          key={index}
          value={cell}
          onClick={() => onCellClick(index)}
          disabled={disabled || cell !== null}
          isWinningCell={winningCells.includes(index)}
        />
      ))}
    </div>
  );
}
