import type { BJCard, BJGameState, BJPlayer, BJUIPhase, Suit } from '../types/blackjack';

// ── Affichage des cartes ───────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

/**
 * Rendu textuel d'une carte.
 * - Carte cachée → '🂠' (dos de carte)
 * - Carte visible → '♠A', '♥K', '♦10', etc.
 */
export function getCardDisplay(card: BJCard): string {
  if (card.hidden) return '🂠';
  return `${getSuitSymbol(card.suit)}${card.rank}`;
}

// ── Phase UI dérivée ──────────────────────────────────────────────────────────

/**
 * Calcule la phase UI à partir de l'état serveur et de l'identité du socket.
 *
 * Mapping :
 *   null               → 'idle'
 *   phase 'waiting'    → 'waiting'
 *   phase 'playing'    → 'my-turn' si c'est mon tour, sinon 'waiting-turn'
 *   phase 'dealer-turn'→ 'dealer-turn'
 *   phase 'over'       → 'over'
 */
export function getBlackjackPhase(
  state: BJGameState | null,
  socketId: string,
): BJUIPhase {
  if (!state) return 'idle';
  if (state.phase === 'waiting') return 'waiting';
  if (state.phase === 'dealer-turn') return 'dealer-turn';
  if (state.phase === 'over') return 'over';
  if (state.phase === 'playing') {
    const current = state.players[state.currentPlayerIndex];
    return current?.socketId === socketId ? 'my-turn' : 'waiting-turn';
  }
  return 'idle';
}

export function isMyTurn(state: BJGameState | null, socketId: string): boolean {
  if (!state || state.phase !== 'playing') return false;
  return state.players[state.currentPlayerIndex]?.socketId === socketId;
}

/** Retourne l'état du joueur courant (moi). */
export function getMyPlayer(
  state: BJGameState | null,
  socketId: string,
): BJPlayer | null {
  if (!state) return null;
  return state.players.find((p) => p.socketId === socketId) ?? null;
}

/** Score calculé côté client (pour affichage) — même logique qu'en backend. */
export function calcScore(cards: BJCard[]): number {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.hidden) continue; // ne pas compter les cartes cachées
    if (card.rank === 'A') { score += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(card.rank)) score += 10;
    else score += parseInt(card.rank, 10);
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

/** Label lisible pour un résultat Blackjack. */
export function getResultLabel(result: string | undefined): string {
  switch (result) {
    case 'blackjack': return '🎉 Blackjack !';
    case 'win':       return '✅ Gagné';
    case 'lose':      return '❌ Perdu';
    case 'push':      return '🤝 Égalité';
    default:          return '';
  }
}
