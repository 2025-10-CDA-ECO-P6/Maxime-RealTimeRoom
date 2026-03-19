import type { BJUIPhase } from '../../types/blackjack';

interface BlackjackControlsProps {
  phase: BJUIPhase;
  canDouble: boolean;
  canSplit: boolean;
  onJoin: () => void;
  onStart: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onLeave: () => void;
}

export function BlackjackControls({
  phase,
  canDouble,
  canSplit,
  onJoin,
  onStart,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onLeave,
}: BlackjackControlsProps) {
  if (phase === 'idle') {
    return (
      <button className="game-btn game-btn--join" onClick={onJoin}>
        Join Table
      </button>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="bj-controls-row">
        <button className="game-btn game-btn--join" onClick={onStart}>
          Démarrer le round
        </button>
        <button className="game-btn game-btn--leave" onClick={onLeave}>
          Quitter
        </button>
      </div>
    );
  }

  if (phase === 'my-turn') {
    return (
      <div className="bj-controls-row">
        <button className="bj-btn bj-btn--hit" onClick={onHit}>Hit</button>
        <button className="bj-btn bj-btn--stand" onClick={onStand}>Stand</button>
        {canDouble && (
          <button className="bj-btn bj-btn--double" onClick={onDouble}>Double</button>
        )}
        {canSplit && (
          <button className="bj-btn bj-btn--split" onClick={onSplit}>Split</button>
        )}
      </div>
    );
  }

  if (phase === 'waiting-turn' || phase === 'dealer-turn') {
    return (
      <div className="bj-controls-row">
        <button className="game-btn game-btn--leave" onClick={onLeave}>
          Quitter
        </button>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <div className="bj-controls-row">
        <button className="game-btn game-btn--join" onClick={onJoin}>
          Nouvelle partie
        </button>
        <button className="game-btn game-btn--leave" onClick={onLeave}>
          ← Lobby
        </button>
      </div>
    );
  }

  return null;
}
