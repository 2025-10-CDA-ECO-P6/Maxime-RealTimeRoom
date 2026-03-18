import { useState, useEffect } from 'react';
import { socket } from '../socket';
import type { GameState, Player } from '../types/game';

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mySocketId, setMySocketId] = useState<string>(socket.id ?? '');

  useEffect(() => {
    socket.on('connect', () => setMySocketId(socket.id ?? ''));

    socket.on('game:waiting', () => {
      setGameState({
        phase: 'waiting',
        board: Array(9).fill(null),
        currentPlayer: 'X',
        players: { X: '', O: '' },
        gameId: '',
      });
    });

    socket.on(
      'game:start',
      (data: {
        board: null[];
        currentPlayer: Player;
        players: { X: string; O: string };
        gameId: string;
      }) => {
        setGameState({ phase: 'playing', ...data });
      },
    );

    socket.on(
      'game:update',
      (data: {
        board: (Player | null)[];
        currentPlayer: Player;
        winner: Player | null;
        isDraw: boolean;
      }) => {
        setGameState((prev) => {
          if (!prev) return null;
          const isOver = !!(data.winner || data.isDraw);
          return {
            ...prev,
            board: data.board,
            currentPlayer: data.currentPlayer,
            phase: isOver ? 'over' : 'playing',
            winner: data.winner,
          };
        });
      },
    );

    socket.on(
      'game:over',
      (data: { winner: Player | null; isDraw?: boolean; reason?: string }) => {
        if (data.reason === 'opponent-left') {
          setGameState(null);
          return;
        }
        setGameState((prev) => {
          if (!prev) return null;
          return { ...prev, phase: 'over', winner: data.winner };
        });
      },
    );

    return () => {
      socket.off('connect');
      socket.off('game:waiting');
      socket.off('game:start');
      socket.off('game:update');
      socket.off('game:over');
    };
  }, []);

  function joinGame() {
    socket.emit('game:join', { gameType: 'tictactoe' });
  }

  function makeMove(position: number) {
    if (!gameState?.gameId) return;
    socket.emit('game:move', { gameId: gameState.gameId, position });
  }

  function resetGame() {
    if (!gameState?.gameId) return;
    socket.emit('game:reset', { gameId: gameState.gameId });
  }

  function leaveGame() {
    socket.emit(
      'game:leave',
      gameState?.gameId
        ? { gameType: 'tictactoe', gameId: gameState.gameId }
        : { gameType: 'tictactoe' },
    );
    setGameState(null);
  }

  return { gameState, mySocketId, joinGame, makeMove, resetGame, leaveGame };
}
