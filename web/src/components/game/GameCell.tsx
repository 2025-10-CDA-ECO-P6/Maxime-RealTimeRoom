interface GameCellProps {
  value: string | null;
  onClick: () => void;
  disabled: boolean;
  isWinningCell: boolean;
}

export function GameCell({ value, onClick, disabled, isWinningCell }: GameCellProps) {
  return (
    <button
      className={`game-cell${value ? ` game-cell--${value.toLowerCase()}` : ''}${isWinningCell ? ' game-cell--winning' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {value}
    </button>
  );
}
