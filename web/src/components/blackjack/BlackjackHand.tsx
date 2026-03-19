import { BlackjackCard } from './BlackjackCard';
import { calcScore, getResultLabel } from '../../utils/blackjackLogic';
import type { BJHand, BJResult } from '../../types/blackjack';

interface BlackjackHandProps {
  hand: BJHand;
  isActive?: boolean;
  result?: BJResult;
}

const STATUS_LABELS: Record<string, string> = {
  stand:     'Stand',
  bust:      'Bust !',
  blackjack: 'Blackjack !',
  doubled:   'Doublé',
  playing:   '',
};

export function BlackjackHand({ hand, isActive, result }: BlackjackHandProps) {
  const score = calcScore(hand.cards);
  const statusLabel = STATUS_LABELS[hand.status] ?? '';

  return (
    <div className={`bj-hand ${isActive ? 'bj-hand--active' : ''} bj-hand--${hand.status}`}>
      <div className="bj-hand-cards">
        {hand.cards.map((card, i) => (
          <BlackjackCard key={i} card={card} />
        ))}
      </div>

      <div className="bj-hand-info">
        <span className="bj-hand-score">{score}</span>
        {statusLabel && <span className="bj-hand-status">{statusLabel}</span>}
        {result && <span className="bj-hand-result">{getResultLabel(result)}</span>}
      </div>
    </div>
  );
}
