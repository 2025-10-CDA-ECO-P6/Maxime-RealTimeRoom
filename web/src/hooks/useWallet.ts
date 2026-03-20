import { useEffect, useState } from 'react';
import { socket } from '../socket';

export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [lastDelta, setLastDelta] = useState<number | null>(null);

  useEffect(() => {
    socket.emit('wallet:get');

    function onUpdate({ balance, delta }: { balance: number; delta?: number }) {
      setBalance(balance);
      // On ne met à jour le delta que si c'est un vrai gain/perte (pas l'init)
      if (delta !== undefined && delta !== 0) {
        setLastDelta(delta);
      }
    }

    socket.on('wallet:update', onUpdate);
    return () => { socket.off('wallet:update', onUpdate); };
  }, []);

  return { balance, lastDelta };
}
