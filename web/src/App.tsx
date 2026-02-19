import { useState } from 'react';
import { Login } from './pages/Login';
import Chat from './pages/Chat';
import './App.css';

function App() {
  const [username, setUsername] = useState<string | null>(null);

  if (!username) {
    return <Login onLogin={setUsername} />;
  }

  return <Chat username={username} />;
}

export default App;
