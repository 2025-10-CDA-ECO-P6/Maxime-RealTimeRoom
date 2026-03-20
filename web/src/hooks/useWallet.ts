import { useEffect, useState } from 'react';
import { socket } from '../socket';

export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Demander le solde actuel dès le montage
    socket.emit('wallet:get');

    function onUpdate({ balance }: { balance: number }) {
      setBalance(balance);
    }

    socket.on('wallet:update', onUpdate);
    return () => { socket.off('wallet:update', onUpdate); };
  }, []);

  return { balance };
}
