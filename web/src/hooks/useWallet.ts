import { useEffect, useState, useCallback } from 'react';
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
      // On met à jour lastDelta seulement après un résultat de jeu réel
      // (pas à l'initialisation du wallet)
      if (isGameResult && delta !== undefined) {
        setLastDelta(delta);
      }
    }

    socket.on('wallet:update', onUpdate);
    return () => { socket.off('wallet:update', onUpdate); };
  }, []);

  // Réinitialise le delta affiché (ex: quand on change de jeu)
  const resetDelta = useCallback(() => setLastDelta(null), []);

  return { balance, lastDelta, resetDelta };
}
