export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export type GamePhase =
  | 'idle'
  | 'waiting'
  | 'playing-your-turn'
  | 'playing-opponent-turn'
  | 'won'
  | 'lost'
  | 'draw';

export interface GameState {
  phase: 'idle' | 'waiting' | 'playing' | 'over';
  board: Board;
  currentPlayer: Player;
  players: { X: string; O: string };
  gameId: string;
  winner?: Player | null;
}
