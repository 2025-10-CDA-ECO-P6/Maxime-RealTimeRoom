import './GameLobby.css';

type GameType = 'tictactoe' | 'blackjack';

interface GameLobbyProps {
  onSelectGame: (gameType: GameType) => void;
}

const GAMES = [
  {
    type: 'tictactoe' as GameType,
    title: 'Tic-Tac-Toe',
    icon: '✕ ○',
    description: '2 joueurs · Tour par tour',
    rules: 'Aligne 3 symboles pour gagner.',
    players: '2 joueurs',
  },
  {
    type: 'blackjack' as GameType,
    title: 'Blackjack',
    icon: '♠ ♥',
    description: '1–4 joueurs vs dealer',
    rules: 'Approche 21 sans dépasser. Hit, Stand, Double, Split.',
    players: '1–4 joueurs',
  },
];

export function GameLobby({ onSelectGame }: GameLobbyProps) {
  return (
    <div className="lobby">
      <h2 className="lobby-title">Choisissez un jeu</h2>
      <div className="lobby-games">
        {GAMES.map((game) => (
          <div key={game.type} className="lobby-card">
            <div className="lobby-card-icon">{game.icon}</div>
            <div className="lobby-card-title">{game.title}</div>
            <div className="lobby-card-desc">{game.description}</div>
            <div className="lobby-card-rules">{game.rules}</div>
            <button
              className="lobby-card-btn"
              onClick={() => onSelectGame(game.type)}
            >
              Rejoindre
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
