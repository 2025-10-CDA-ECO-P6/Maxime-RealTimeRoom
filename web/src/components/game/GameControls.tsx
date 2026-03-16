import type { GamePhase } from '../../types/game';

interface GameControlsProps {
  phase: GamePhase;
  onJoin: () => void;
  onReset: () => void;
  onLeave: () => void;
}

export function GameControls({ phase, onJoin, onReset, onLeave }: GameControlsProps) {
  if (phase === 'idle') {
    return (
      <button className="game-btn game-btn--join" onClick={onJoin}>
        Join Game
      </button>
    );
  }

  if (phase === 'waiting') {
    return (
      <button className="game-btn game-btn--leave" onClick={onLeave}>
        Cancel
      </button>
    );
  }

  if (phase === 'playing-your-turn' || phase === 'playing-opponent-turn') {
    return (
      <button className="game-btn game-btn--leave" onClick={onLeave}>
        Leave Game
      </button>
    );
  }

  if (phase === 'won' || phase === 'lost' || phase === 'draw') {
    return (
      <div className="game-controls-end">
        <button className="game-btn game-btn--reset" onClick={onReset}>
          Play Again
        </button>
        <button className="game-btn game-btn--leave" onClick={onLeave}>
          Leave
        </button>
      </div>
    );
  }

  return null;
}
