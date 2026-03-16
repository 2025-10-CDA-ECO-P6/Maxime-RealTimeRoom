import { useGame } from '../../hooks/useGame';
import { getGamePhase, getWinningCells } from '../../utils/gameLogic';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { GameStatus } from './GameStatus';
import './GameBoard.css';

export function GameArea() {
  const { gameState, mySocketId, joinGame, makeMove, resetGame, leaveGame } = useGame();

  const phase = getGamePhase(gameState, mySocketId);

  const winningCells =
    gameState?.phase === 'over' && gameState.winner
      ? getWinningCells(gameState.board, gameState.winner)
      : [];

  const boardDisabled = phase !== 'playing-your-turn';

  return (
    <div className="game-area">
      <h2 className="game-area-title">Tic-Tac-Toe</h2>
      <GameStatus phase={phase} />
      {gameState && gameState.phase !== 'waiting' && (
        <GameBoard
          board={gameState.board}
          onCellClick={makeMove}
          disabled={boardDisabled}
          winningCells={winningCells}
        />
      )}
      <GameControls phase={phase} onJoin={joinGame} onReset={resetGame} onLeave={leaveGame} />
    </div>
  );
}
