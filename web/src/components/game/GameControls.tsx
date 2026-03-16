import type { GamePhase } from '../../types/game';

interface GameControlsProps {
  phase: GamePhase;
  onJoin: () => void;
  onReset: () => void;
}

export function GameControls({ phase, onJoin, onReset }: GameControlsProps) {
  if (phase === 'idle') {
    return (
      <button className="game-btn game-btn--join" onClick={onJoin}>
        Join Game
      </button>
    );
  }
  if (phase === 'won' || phase === 'lost' || phase === 'draw') {
    return (
      <button className="game-btn game-btn--reset" onClick={onReset}>
        Play Again
      </button>
    );
  }
  return null;
}
