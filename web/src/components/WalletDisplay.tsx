interface Props {
  balance: number | null;
}

export function WalletDisplay({ balance }: Props) {
  return (
    <div className="wallet-display">
      <span className="wallet-icon">🪙</span>
      <span className="wallet-balance">
        {balance === null ? '—' : `${balance} pièces`}
      </span>
    </div>
  );
}
