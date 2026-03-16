import type { GamePhase } from '../../types/game';

interface GameStatusProps {
  phase: GamePhase;
}

const MESSAGES: Record<GamePhase, string> = {
  idle: 'Join a game to play!',
  waiting: 'Looking for opponent...',
  'playing-your-turn': 'Your turn',
  'playing-opponent-turn': "Opponent's turn",
  won: 'You won! 🎉',
  lost: 'You lost.',
  draw: 'Draw!',
};

export function GameStatus({ phase }: GameStatusProps) {
  return (
    <div className={`game-status game-status--${phase}`}>
      {MESSAGES[phase]}
    </div>
  );
}
