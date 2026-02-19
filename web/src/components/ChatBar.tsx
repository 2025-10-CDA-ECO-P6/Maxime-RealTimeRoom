import { useState } from 'react';

export function ChatBar({
  onSend,
  isConnected,
}: {
  onSend: (text: string) => void;
  isConnected: boolean;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function addEmoji(emoji: string) {
    setValue((prev) => prev + emoji);
  }

  return (
    <div className="skype-chatbar">
      <div className="skype-chatbar-emojis">
        {['😊', '😂', '❤️', '👍', '😮', '😢'].map((emoji) => (
          <button key={emoji} type="button" onClick={() => addEmoji(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
      <form className="skype-chatbar-form" onSubmit={handleSubmit}>
        <textarea
          className="skype-chatbar-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="skype-chatbar-send"
          disabled={!isConnected || !value.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
