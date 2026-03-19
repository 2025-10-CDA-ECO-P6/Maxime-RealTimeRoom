import { getCardDisplay } from '../../utils/blackjackLogic';
import type { BJCard } from '../../types/blackjack';

interface BlackjackCardProps {
  card: BJCard;
}

export function BlackjackCard({ card }: BlackjackCardProps) {
  const display = getCardDisplay(card);
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <span
      className={`bj-card ${card.hidden ? 'bj-card--hidden' : ''} ${isRed ? 'bj-card--red' : ''}`}
    >
      {display}
    </span>
  );
}
