import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameStatus } from '../components/game/GameStatus';

describe('GameStatus', () => {
  test('affiche un message d\'attente quand phase est "waiting"', () => {
    render(<GameStatus phase="waiting" />);
    expect(screen.getByText(/waiting|opponent|attente/i)).toBeInTheDocument();
  });

  test('affiche "Your turn" quand phase est "playing-your-turn"', () => {
    render(<GameStatus phase="playing-your-turn" />);
    expect(screen.getByText(/your turn/i)).toBeInTheDocument();
  });

  test('affiche "Opponent" quand phase est "playing-opponent-turn"', () => {
    render(<GameStatus phase="playing-opponent-turn" />);
    expect(screen.getByText(/opponent/i)).toBeInTheDocument();
  });

  test('affiche "You won" quand phase est "won"', () => {
    render(<GameStatus phase="won" />);
    expect(screen.getByText(/you won/i)).toBeInTheDocument();
  });

  test('affiche "You lost" quand phase est "lost"', () => {
    render(<GameStatus phase="lost" />);
    expect(screen.getByText(/you lost/i)).toBeInTheDocument();
  });

  test('affiche "Draw" quand phase est "draw"', () => {
    render(<GameStatus phase="draw" />);
    expect(screen.getByText(/draw/i)).toBeInTheDocument();
  });
});
