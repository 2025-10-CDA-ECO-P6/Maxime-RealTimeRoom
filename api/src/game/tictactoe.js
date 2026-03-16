const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
  [0, 4, 8], [2, 4, 6],             // diagonales
];

function createBoard() {
  return Array(9).fill(null);
}

function isValidMove(board, position) {
  if (position < 0 || position > 8) return false;
  return board[position] === null;
}

function makeMove(board, position, player) {
  if (!isValidMove(board, position)) {
    throw new Error(`Coup invalide à la position ${position}`);
  }
  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
}

function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board) {
  if (checkWinner(board)) return false;
  return board.every((cell) => cell !== null);
}

function getWinningLine(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

module.exports = { createBoard, isValidMove, makeMove, checkWinner, isDraw, getWinningLine };
