import { useState } from 'react';

interface WaitingPlayer {
  socketId: string;
  ready?: boolean;
}

interface Props {
  balance: number | null;
  players: WaitingPlayer[];
  mySocketId: string;
  onReady: (bet: number) => void;
  onLeave: () => void;
}

const BET_OPTIONS = [5, 10, 25, 50];

export function BlackjackBet({ balance, players, mySocketId, onReady, onLeave }: Props) {
  const [selected, setSelected] = useState<number>(10);

  const maxBet = balance ?? 0;
  const me = players.find((p) => p.socketId === mySocketId);
  const iAmReady = me?.ready === true;
  const readyCount = players.filter((p) => p.ready === true).length;
  const canConfirm = !iAmReady && selected > 0 && selected <= maxBet;

  return (
    <div className="bj-bet">
      {/* Liste des joueurs du lobby */}
      <div className="bj-bet__players">
        {players.map((p, i) => (
          <div
            key={p.socketId}
            className={`bj-bet__player ${p.ready ? 'bj-bet__player--ready' : ''}`}
          >
            <span>{p.socketId === mySocketId ? '👤 Toi' : `Joueur ${i + 1}`}</span>
            <span className="bj-bet__player-status">{p.ready ? '✅ Prêt' : '⏳'}</span>
          </div>
        ))}
      </div>

      {iAmReady ? (
        <p className="bj-bet__waiting">
          ⏳ En attente des autres joueurs… ({readyCount}/{players.length})
        </p>
      ) : (
        <>
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
          <p className="bj-bet__mise-label">
            Mise : <strong>{selected} pièces</strong>
          </p>
          <button
            className="game-btn game-btn--join"
            disabled={!canConfirm}
            onClick={() => onReady(selected)}
          >
            Prêt !
          </button>
        </>
      )}

      <button className="game-btn game-btn--leave bj-bet__leave" onClick={onLeave}>
        ← Lobby
      </button>
    </div>
  );
}
