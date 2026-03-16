import type { Cell, GamePhase, GameState, Player } from '../types/game';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function getGamePhase(state: GameState | null, mySocketId: string): GamePhase {
  if (!state) return 'idle';
  if (state.phase === 'waiting') return 'waiting';
  if (state.phase === 'playing') {
    const myPlayer = state.players.X === mySocketId ? 'X' : 'O';
    return state.currentPlayer === myPlayer ? 'playing-your-turn' : 'playing-opponent-turn';
  }
  if (state.phase === 'over') {
    if (!state.winner) return 'draw';
    const myPlayer = state.players.X === mySocketId ? 'X' : 'O';
    return state.winner === myPlayer ? 'won' : 'lost';
  }
  return 'idle';
}

export function isMyTurn(state: GameState, mySocketId: string): boolean {
  const myPlayer = state.players.X === mySocketId ? 'X' : 'O';
  return state.currentPlayer === myPlayer;
}

export function getWinningCells(board: (Cell | string | null)[], player: Player | string): number[] {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] === player && board[b] === player && board[c] === player) {
      return line;
    }
  }
  return [];
}
