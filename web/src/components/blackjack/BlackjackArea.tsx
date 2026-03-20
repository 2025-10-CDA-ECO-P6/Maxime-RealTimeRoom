import { useBlackjack } from '../../hooks/useBlackjack';
import { getBlackjackPhase, getMyPlayer, calcScore } from '../../utils/blackjackLogic';
import { BlackjackCard } from './BlackjackCard';
import { BlackjackHand } from './BlackjackHand';
import { BlackjackControls } from './BlackjackControls';
import { BlackjackBet } from './BlackjackBet';
import { GameSummary } from '../GameSummary';
import './BlackjackTable.css';
import '../../components/game/GameBoard.css'; // réutiliser les boutons game-btn

interface BlackjackAreaProps {
  onLeave?: () => void;
  balance?: number | null;
  lastDelta?: number | null;
}

export function BlackjackArea({ onLeave, balance, lastDelta }: BlackjackAreaProps) {
  const {
    gameState,
    mySocketId,
    joinGame,
    startRound,
    setReady,
    hit,
    stand,
    double,
    split,
    leaveGame,
  } = useBlackjack();

  const phase = getBlackjackPhase(gameState, mySocketId);
  const myPlayer = getMyPlayer(gameState, mySocketId);
  const myHand = myPlayer?.hands[myPlayer.currentHandIndex];

  const canDbl = myHand ? myHand.cards.length === 2 && myHand.status === 'playing' : false;
  const canSpl = myHand
    ? myHand.cards.length === 2 &&
      myHand.cards[0].rank === myHand.cards[1].rank &&
      myHand.status === 'playing'
    : false;

  function handleLeave() {
    leaveGame();
    onLeave?.();
  }

  // ── Status message ────────────────────────────────────────────────────────
  function getStatusText() {
    switch (phase) {
      case 'idle':         return 'Rejoins une table pour jouer !';
      case 'waiting':      return `En attente... (${gameState?.players.length ?? 1}/4) — Sélectionne ta mise et clique Prêt !`;
      case 'my-turn':      return '🎴 C\'est ton tour !';
      case 'waiting-turn': return '⏳ En attente du tour des autres joueurs...';
      case 'dealer-turn':  return '🃏 Le dealer joue...';
      case 'over':         return '✅ Fin du round';
      default:             return '';
    }
  }

  // ── Dealer score (masqué si carte cachée) ─────────────────────────────────
  const visibleDealerCards = gameState?.dealerCards.filter((c) => !c.hidden) ?? [];
  const dealerScore = visibleDealerCards.length > 0 ? calcScore(visibleDealerCards) : 0;

  return (
    <div className="bj-area">
      <h2 className="bj-title">♠ Blackjack ♥</h2>

      <div className="bj-status">{getStatusText()}</div>
      {phase === 'over' && <GameSummary delta={lastDelta ?? null} />}

      {/* Zone Dealer */}
      {gameState && gameState.phase !== 'waiting' && (
        <div className="bj-dealer-zone">
          <div className="bj-zone-label">
            Dealer {phase === 'over' ? `— ${calcScore(gameState.dealerCards)}` : dealerScore > 0 ? `— ${dealerScore}+` : ''}
          </div>
          <div className="bj-cards-row">
            {gameState.dealerCards.map((card, i) => (
              <BlackjackCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Zone Joueurs */}
      {gameState && gameState.phase !== 'waiting' && gameState.players.length > 0 && (
        <div className="bj-players-zone">
          {gameState.players.map((player, pi) => {
            const isMe = player.socketId === mySocketId;
            const isCurrentPlayer = pi === gameState.currentPlayerIndex;
            return (
              <div
                key={player.socketId}
                className={`bj-player ${isMe ? 'bj-player--me' : ''} ${isCurrentPlayer && phase !== 'over' ? 'bj-player--active' : ''}`}
              >
                <div className="bj-player-label">
                  {isMe ? '👤 Toi' : `Joueur ${pi + 1}`}
                  {isCurrentPlayer && phase !== 'over' && phase !== 'dealer-turn' && ' 🎯'}
                </div>
                {player.hands.map((hand, hi) => (
                  <BlackjackHand
                    key={hi}
                    hand={hand}
                    isActive={
                      isCurrentPlayer &&
                      hi === player.currentHandIndex &&
                      phase !== 'over' &&
                      phase !== 'dealer-turn'
                    }
                    result={player.result?.[hi]}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Lobby waiting : sélection mise + bouton Prêt pour chaque joueur */}
      {phase === 'waiting' && (
        <BlackjackBet
          balance={balance ?? null}
          players={gameState?.players ?? []}
          mySocketId={mySocketId}
          onReady={setReady}
        />
      )}

      {/* Contrôles — toutes les autres phases */}
      {phase !== 'waiting' && (
        <BlackjackControls
          phase={phase}
          canDouble={canDbl}
          canSplit={canSpl}
          onJoin={joinGame}
          onStart={() => startRound()}
          onHit={hit}
          onStand={stand}
          onDouble={double}
          onSplit={split}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
