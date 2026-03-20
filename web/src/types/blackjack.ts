export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface BJCard {
  suit: Suit;
  rank: Rank;
  hidden?: boolean;
}

export type BJHandStatus = 'playing' | 'stand' | 'bust' | 'blackjack' | 'doubled';
export type BJResult = 'win' | 'lose' | 'push' | 'blackjack';

export interface BJHand {
  cards: BJCard[];
  doubled: boolean;
  status: BJHandStatus;
  result?: BJResult;
}

export interface BJPlayer {
  socketId: string;
  hands: BJHand[];
  currentHandIndex: number;
  result: BJResult[] | null;
  ready?: boolean; // phase waiting uniquement
}

/** Phase interne de la room (serveur) */
export type BJRoomPhase = 'waiting' | 'playing' | 'dealer-turn' | 'over';

/** État reçu depuis le serveur */
export interface BJGameState {
  gameId: string;
  phase: BJRoomPhase;
  players: BJPlayer[];
  dealerCards: BJCard[];
  currentPlayerIndex: number;
}

/** Phase dérivée pour l'UI (calculée côté client) */
export type BJUIPhase =
  | 'idle'
  | 'waiting'
  | 'my-turn'
  | 'waiting-turn'
  | 'dealer-turn'
  | 'over';
