import { useState } from 'react';
import './Login.css';

export function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Le pseudo doit contenir au moins 2 caractères');
      return;
    }
    if (trimmed.length > 20) {
      setError('Le pseudo ne peut pas dépasser 20 caractères');
      return;
    }
    onLogin(trimmed);
  }

  return (
    <div className="skype-login-backdrop">
      <div className="skype-login-window">
        <div className="skype-login-titlebar">
          <div className="skype-login-titlebar-left">
            <div className="skype-login-logo">S</div>
            <span>Skype™ - Sign In</span>
          </div>
          <div className="skype-login-titlebar-controls">
            <button className="skype-ctrl minimize">─</button>
            <button className="skype-ctrl close">✕</button>
          </div>
        </div>

        <div className="skype-login-body">
          <div className="skype-login-hero">
            <div className="skype-login-cloud cloud-1" />
            <div className="skype-login-cloud cloud-2" />
            <div className="skype-login-cloud cloud-3" />
            <div className="skype-login-biglogo">S</div>
            <div className="skype-login-tagline">
              Connecting people since 2003
            </div>
          </div>
          <form className="skype-login-form" onSubmit={handleSubmit}>
            <label className="skype-login-label" htmlFor="username">
              Skype Name
            </label>
            <input
              id="username"
              className="skype-login-input"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter your pseudo..."
              autoFocus
              maxLength={20}
            />
            {error && <div className="skype-login-error">{error}</div>}

            <button type="submit" className="skype-login-btn">
              Sign In
            </button>

            <div className="skype-login-footer">
              <span>Don't have an account?</span>
              <span className="skype-login-link">Create one — it's free!</span>
            </div>
          </form>
        </div>
        <div className="skype-login-statusbar">
          <span>Ready</span>
          <span>v4.2.0</span>
        </div>
      </div>
    </div>
  );
}
