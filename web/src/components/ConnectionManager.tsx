import { socket } from '../socket';

export function ConnectionManager({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="skype-connection">
      <div
        className={`skype-connection-dot ${isConnected ? 'online' : 'offline'}`}
      />
      <span
        className="skype-connection-text"
        onClick={() => (isConnected ? socket.disconnect() : socket.connect())}
        style={{ cursor: 'pointer' }}>
        {isConnected ? 'Online' : 'Offline — click to connect'}
      </span>
    </div>
  );
}
