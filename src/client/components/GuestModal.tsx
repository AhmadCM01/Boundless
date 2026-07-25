import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Sparkles, User, ArrowRight, History, DoorOpen } from 'lucide-react';

interface RecentRoom {
  id: string;
  joinedAt: number;
}

export const GuestModal: React.FC = () => {
  const { username, setUsername, roomId } = useRoom();
  const [inputName, setInputName] = useState('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('boundless_recent_rooms');
      if (saved) {
        const parsed: RecentRoom[] = JSON.parse(saved);
        setRecentRooms(parsed);
      }
    } catch (e) {
      console.error('Failed to load recent rooms:', e);
    }
  }, []);

  if (username) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUsername(inputName.trim());
    }
  };

  const navigateToRoom = (targetRoomId: string) => {
    window.location.href = `/room/${targetRoomId}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--modal-backdrop)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: 420,
        padding: 32,
        borderRadius: 24,
        textAlign: 'center',
        maxWidth: '90vw',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px var(--accent-glow)'
        }}>
          <Sparkles size={28} color="#fff" />
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginBottom: 6, color: 'var(--text-heading)' }}>
          Join Boundless
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Collaborate live on room <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{roomId}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Your guest name..."
              autoFocus
              required
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 14,
                border: '1px solid var(--input-border)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              height: 44,
              borderRadius: 14,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span>Enter Canvas</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Recently Visited Rooms List */}
        {recentRooms.length > 0 && (
          <div style={{ borderTop: '1px solid var(--bg-panel-border)', paddingTop: 16, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <History size={14} />
              <span>Recent Rooms</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {recentRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigateToRoom(room.id)}
                  className="tool-btn"
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    background: room.id === roomId ? 'var(--btn-hover-bg)' : 'transparent',
                    border: '1px solid var(--bg-panel-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                    <DoorOpen size={14} color="var(--accent-primary)" />
                    <span>{room.id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {room.id === roomId ? 'Current' : 'Re-join →'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
