import { useState } from 'react';

interface Props {
  balance: number | null;
  onConfirm: (bet: number) => void;
}

const BET_OPTIONS = [5, 10, 25, 50];

export function BlackjackBet({ balance, onConfirm }: Props) {
  const [selected, setSelected] = useState<number>(10);

  const maxBet = balance ?? 0;
  const canConfirm = selected > 0 && selected <= maxBet;

  return (
    <div className="bj-bet">
      <p className="bj-bet__title">Choisissez votre mise</p>
      <div className="bj-bet__options">
        {BET_OPTIONS.map((amount) => (
          <button
            key={amount}
            className={`bj-bet__chip ${selected === amount ? 'bj-bet__chip--active' : ''}`}
            disabled={amount > maxBet}
            onClick={() => setSelected(amount)}
          >
            {amount}
          </button>
        ))}
      </div>
      <p className="bj-bet__mise-label">Mise : <strong>{selected} pièces</strong></p>
      <button
        className="game-btn game-btn--join"
        disabled={!canConfirm}
        onClick={() => onConfirm(selected)}
      >
        Lancer la partie
      </button>
    </div>
  );
}
