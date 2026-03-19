import { useState, useEffect } from 'react';
import { socket } from '../socket';
import type { BJGameState, BJPlayer, BJCard } from '../types/blackjack';

export function useBlackjack() {
  const [gameState, setGameState] = useState<BJGameState | null>(null);
  const [mySocketId, setMySocketId] = useState<string>(socket.id ?? '');

  useEffect(() => {
    socket.on('connect', () => setMySocketId(socket.id ?? ''));

    // Rejoindre une room → état waiting avec gameId
    socket.on(
      'game:waiting',
      (data: { gameId: string; playerCount: number; message: string }) => {
        setGameState((prev) => ({
          gameId: data.gameId,
          phase: 'waiting',
          players: prev?.players ?? [],
          dealerCards: [],
          currentPlayerIndex: 0,
        }));
      },
    );

    // Le round commence — état complet de la partie
    socket.on('game:start', (data: BJGameState) => {
      setGameState({ ...data, phase: 'playing' });
    });

    // Mise à jour après chaque action (hit, stand, split...)
    socket.on('game:update', (data: BJGameState) => {
      setGameState(data);
    });

    // Fin de partie
    socket.on(
      'game:over',
      (data: {
        players: BJPlayer[];
        dealerCards: BJCard[];
        reason?: string;
      }) => {
        if (data.reason === 'opponent-left') {
          setGameState(null);
          return;
        }
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                phase: 'over',
                players: data.players,
                dealerCards: data.dealerCards,
              }
            : null,
        );
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

  // ── Actions ──────────────────────────────────────────────────────────────────

  function joinGame() {
    socket.emit('game:join', { gameType: 'blackjack' });
  }

  function startRound() {
    if (!gameState?.gameId) return;
    socket.emit('game:start-round', { gameId: gameState.gameId });
  }

  function hit() {
    if (!gameState?.gameId) return;
    socket.emit('game:action', { gameId: gameState.gameId, action: 'hit' });
  }

  function stand() {
    if (!gameState?.gameId) return;
    socket.emit('game:action', { gameId: gameState.gameId, action: 'stand' });
  }

  function double() {
    if (!gameState?.gameId) return;
    socket.emit('game:action', { gameId: gameState.gameId, action: 'double' });
  }

  function split() {
    if (!gameState?.gameId) return;
    socket.emit('game:action', { gameId: gameState.gameId, action: 'split' });
  }

  function leaveGame() {
    socket.emit(
      'game:leave',
      gameState?.gameId
        ? { gameType: 'blackjack', gameId: gameState.gameId }
        : { gameType: 'blackjack' },
    );
    setGameState(null);
  }

  return {
    gameState,
    mySocketId,
    joinGame,
    startRound,
    hit,
    stand,
    double,
    split,
    leaveGame,
  };
}
