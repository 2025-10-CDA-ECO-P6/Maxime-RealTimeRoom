import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../pages/Chat';

export function MessagesBox({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="skype-messages">
        <div className="skype-msg-empty">No messages yet. Say hi! 👋</div>
      </div>
    );
  }

  return (
    <div className="skype-messages">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`skype-msg ${msg.self ? 'self' : 'other'}`}>
          <span className="skype-msg-author">{msg.user}</span>
          <div className="skype-msg-bubble">{msg.text}</div>
          <span className="skype-msg-time">{msg.time}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
