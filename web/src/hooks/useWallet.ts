import { useEffect, useState } from 'react';
import { socket } from '../socket';

export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [lastDelta, setLastDelta] = useState<number | null>(null);

  useEffect(() => {
    socket.emit('wallet:get');

    function onUpdate({
      balance,
      delta,
      isGameResult,
    }: {
      balance: number;
      delta?: number;
      isGameResult?: boolean;
    }) {
      setBalance(balance);
      // On met à jour lastDelta uniquement après un vrai résultat de jeu
      if (isGameResult && delta !== undefined) {
        setLastDelta(delta);
      }
    }

    // Réinitialise le delta au début de chaque partie
    function onGameStart() {
      setLastDelta(null);
    }

    socket.on('wallet:update', onUpdate);
    socket.on('game:start', onGameStart);
    return () => {
      socket.off('wallet:update', onUpdate);
      socket.off('game:start', onGameStart);
    };
  }, []);

  function resetDelta() {
    setLastDelta(null);
  }

  return { balance, lastDelta, resetDelta };
}
