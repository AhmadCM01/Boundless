import React from 'react';
import { useRoom } from '../context/RoomContext';

const EMOJIS = ['❤️', '🔥', '🎉', '👏', '🚀'];

export const ReactionsBar: React.FC<{ stageX: number; stageY: number; zoom: number }> = ({
  stageX,
  stageY,
  zoom,
}) => {
  const { provider } = useRoom();

  const sendReaction = (emoji: string) => {
    if (!provider) return;
    const centerWorldX = (window.innerWidth / 2 - stageX) / zoom;
    const centerWorldY = (window.innerHeight / 2 - stageY) / zoom;

    const currentUser = provider.awareness.getLocalState()?.user || {};
    provider.awareness.setLocalStateField('user', {
      ...currentUser,
      reaction: {
        emoji,
        x: centerWorldX,
        y: centerWorldY,
        timestamp: Date.now(),
      },
    });
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        padding: '4px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 100,
      }}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          title={`Send ${emoji} reaction`}
          onClick={() => sendReaction(emoji)}
          className="tool-btn"
          style={{ width: 32, height: 32, fontSize: 16 }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
