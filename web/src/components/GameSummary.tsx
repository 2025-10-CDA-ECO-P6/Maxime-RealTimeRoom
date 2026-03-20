import './GameSummary.css';

interface Props {
  delta: number | null;
}

export function GameSummary({ delta }: Props) {
  if (delta === null) return null;

  const isWin = delta > 0;
  const isLose = delta < 0;

  const icon = isWin ? '🏆' : isLose ? '😔' : '🤝';
  const label = isWin
    ? `+${delta} pièces gagnées !`
    : isLose
    ? `${delta} pièces perdues`
    : 'Égalité — mise récupérée';

  const mod = isWin ? 'win' : isLose ? 'lose' : 'push';

  return (
    <div className={`game-summary game-summary--${mod}`}>
      <span className="game-summary-icon">{icon}</span>
      <span className="game-summary-label">{label}</span>
    </div>
  );
}
