import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { ChatBar } from '../components/ChatBar';
import { ConnectionManager } from '../components/ConnectionManager';
import { MessagesBox } from '../components/MessagesBox';
import './Chat.css';

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  self: boolean;
}

function Chat({ username }: { username: string }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    socket.auth = { username };
    socket.connect();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('chat message', (data: { user: string; text: string }) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          user: data.user,
          text: data.text,
          time,
          self: data.user === username,
        },
      ]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat message');
      socket.disconnect();
    };
  }, [username]);

  function sendMessage(text: string) {
    if (text.trim()) {
      socket.emit('chat message', { user: username, text: text.trim() });
    }
  }
  return (
    <div className="skype-app">
      <div className="skype-titlebar">
        <div className="skype-titlebar-left">
          <div className="skype-logo">S</div>
          <span className="skype-title">Skype™ — {username}</span>
        </div>
        <div className="skype-titlebar-controls">
          <button className="skype-ctrl minimize">─</button>
          <button className="skype-ctrl maximize">□</button>
          <button className="skype-ctrl close">✕</button>
        </div>
      </div>

      <div className="skype-menubar">
        <span>Skype</span>
        <span>Contacts</span>
        <span>Conversation</span>
        <span>Call</span>
        <span>View</span>
        <span>Tools</span>
        <span>Help</span>
      </div>

      <div className="skype-body">
        <div className="skype-sidebar">
          <div className="skype-profile">
            <div className="skype-avatar self">{username[0].toUpperCase()}</div>
            <div className="skype-profile-info">
              <span className="skype-profile-name">{username}</span>
              <ConnectionManager isConnected={isConnected} />
            </div>
          </div>

          <div className="skype-search">
            <input type="text" placeholder="Search contacts..." disabled />
          </div>

          <div className="skype-contacts-header">RECENT</div>
          <div className="skype-contact active">
            <div className="skype-avatar small">#</div>
            <div className="skype-contact-info">
              <span className="skype-contact-name">General Chat</span>
              <span className="skype-contact-status">
                {messages.length > 0
                  ? messages[messages.length - 1].text.slice(0, 30)
                  : 'No messages yet'}
              </span>
            </div>
          </div>
          <div className="skype-contact">
            <div className="skype-avatar small offline">E</div>
            <div className="skype-contact-info">
              <span className="skype-contact-name">Echo Service</span>
              <span className="skype-contact-status">Offline</span>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="skype-chat">
          <div className="skype-chat-header">
            <div className="skype-avatar small">#</div>
            <div>
              <div className="skype-chat-title">General Chat</div>
              <div className="skype-chat-subtitle">
                {isConnected ? '● Connected' : '○ Disconnected'}
              </div>
            </div>
            <div className="skype-chat-actions">
              <button title="Voice call">📞</button>
              <button title="Video call">📹</button>
              <button title="Add people">➕</button>
            </div>
          </div>

          <MessagesBox messages={messages} />
          <ChatBar onSend={sendMessage} isConnected={isConnected} />
        </div>
      </div>

      <div className="skype-statusbar">
        <span>{isConnected ? '🟢 Online' : '🔴 Offline'}</span>
        <span>Skype Credit: Free</span>
      </div>
    </div>
  );
}

export default Chat;
