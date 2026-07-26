import React, { useEffect, useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';

interface FloatingReaction {
  id: string;
  emoji: string;
  username: string;
  color: string;
  x: number;        // world-space X
  y: number;        // world-space Y
  timestamp: number;
  offsetY: number;  // animation float offset
}

const REACTION_LIFETIME_MS = 4000;
const EMOJIS = ['❤️', '🔥', '🎉', '👏', '🚀'];

interface ReactionsBarProps {
  stageX: number;
  stageY: number;
  zoom: number;
}

export const ReactionsBar: React.FC<ReactionsBarProps> = ({ stageX, stageY, zoom }) => {
  const { provider, onlineUsers, username, userColor } = useRoom();
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const rafRef = useRef<number>();

  // ─── Watch awareness for remote reactions ────────────────────────────────────
  useEffect(() => {
    if (!provider?.awareness) return;

    const handleChange = () => {
      const states = provider.awareness.getStates();
      const now = Date.now();

      states.forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return; // skip self
        const r = state.user?.reaction;
        if (!r || now - r.timestamp > REACTION_LIFETIME_MS) return;

        setFloatingReactions((prev) => {
          // Deduplicate: one reaction per clientId per timestamp
          const exists = prev.find(
            (fr) => fr.id === `${clientId}_${r.timestamp}`
          );
          if (exists) return prev;

          const newReaction: FloatingReaction = {
            id: `${clientId}_${r.timestamp}`,
            emoji: r.emoji,
            username: state.user?.username || 'Someone',
            color: state.user?.color || '#6366f1',
            x: r.x,
            y: r.y,
            timestamp: r.timestamp,
            offsetY: 0,
          };
          return [...prev, newReaction];
        });
      });
    };

    provider.awareness.on('change', handleChange);
    return () => provider.awareness.off('change', handleChange);
  }, [provider]);

  // ─── Animate & expire reactions ──────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setFloatingReactions((prev) =>
        prev
          .filter((r) => now - r.timestamp < REACTION_LIFETIME_MS)
          .map((r) => ({
            ...r,
            offsetY: r.offsetY - 0.6, // float upward
          }))
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ─── Send local reaction ─────────────────────────────────────────────────────
  const sendReaction = (emoji: string) => {
    if (!provider?.awareness) return;

    // Place reaction near the center of the current viewport in world space
    const worldX = (window.innerWidth / 2 - stageX) / (zoom || 1);
    const worldY = (window.innerHeight / 2 - stageY) / (zoom || 1);
    const ts = Date.now();

    // Broadcast via awareness
    const current = provider.awareness.getLocalState() || {};
    const currentUser = (current as any).user || {};
    provider.awareness.setLocalState({
      ...current,
      user: {
        ...currentUser,
        reaction: { emoji, x: worldX, y: worldY, timestamp: ts },
      },
    });

    // Also show locally
    setFloatingReactions((prev) => [
      ...prev,
      {
        id: `local_${ts}`,
        emoji,
        username: username || 'You',
        color: userColor,
        x: worldX,
        y: worldY,
        timestamp: ts,
        offsetY: 0,
      },
    ]);
  };

  // ─── Convert world-space reaction to screen-space ────────────────────────────
  const toScreen = (r: FloatingReaction) => ({
    x: r.x * (zoom || 1) + stageX,
    y: r.y * (zoom || 1) + stageY + r.offsetY,
  });

  const age = (r: FloatingReaction) => (Date.now() - r.timestamp) / REACTION_LIFETIME_MS;

  return (
    <>
      {/* ── Floating Emoji Particles (world-anchored) ─────────────────────── */}
      {floatingReactions.map((r) => {
        const screen = toScreen(r);
        const opacity = Math.max(0, 1 - age(r));

        return (
          <div
            key={r.id}
            style={{
              position: 'fixed',
              left: screen.x,
              top: screen.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 9998,
              opacity,
              transition: 'opacity 0.1s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 32, lineHeight: 1, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>
              {r.emoji}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                background: r.color,
                borderRadius: 20,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {r.username}
            </span>
          </div>
        );
      })}

      {/* ── Static Reaction Trigger Dock (hidden on mobile) ──────────────── */}
      <div
        className="glass-panel reactions-bar-dock"
        style={{
          position: 'fixed',
          bottom: 24,
          left: 76,
          height: 44,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            title={`Send ${emoji} reaction`}
            onClick={() => sendReaction(emoji)}
            className="tool-btn"
            style={{ width: 34, height: 34, fontSize: 18, borderRadius: 10 }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
