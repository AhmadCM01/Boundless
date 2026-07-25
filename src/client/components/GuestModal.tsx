import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Sparkles, User, ArrowRight, History, DoorOpen, Edit3 } from 'lucide-react';

interface RecentRoom {
  id: string;
  joinedAt: number;
}

export const GuestModal: React.FC = () => {
  const { username, setUsername, roomId } = useRoom();
  const [inputName, setInputName] = useState('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [roomTitles, setRoomTitles] = useState<Record<string, string>>({});
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  useEffect(() => {
    try {
      const savedRooms = localStorage.getItem('boundless_recent_rooms');
      if (savedRooms) {
        setRecentRooms(JSON.parse(savedRooms));
      }
      const savedTitles = localStorage.getItem('boundless_room_titles');
      if (savedTitles) {
        setRoomTitles(JSON.parse(savedTitles));
      }
    } catch (e) {
      console.error('Failed to load dashboard room history:', e);
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

  const handleSaveRoomTitle = (targetId: string) => {
    if (editTitleInput.trim()) {
      const updated = { ...roomTitles, [targetId]: editTitleInput.trim() };
      setRoomTitles(updated);
      localStorage.setItem('boundless_room_titles', JSON.stringify(updated));
      setEditingRoomId(null);
    }
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
        width: 440,
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
          Join Boundless Workspace
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Collaborate live on room <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{roomTitles[roomId] || roomId}</strong>
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
            <span>Enter Canvas Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Dashboard Room History List with Rename Controls */}
        {recentRooms.length > 0 && (
          <div style={{ borderTop: '1px solid var(--bg-panel-border)', paddingTop: 16, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <History size={14} />
              <span>My Canvas Rooms History</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {recentRooms.map((room) => {
                const isEditing = editingRoomId === room.id;
                const displayName = roomTitles[room.id] || room.id;

                return (
                  <div
                    key={room.id}
                    className="glass-panel"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--bg-panel-border)',
                      gap: 8,
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onBlur={() => handleSaveRoomTitle(room.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRoomTitle(room.id);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-input)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <DoorOpen size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </span>
                        <button
                          onClick={() => {
                            setEditTitleInput(displayName);
                            setEditingRoomId(room.id);
                          }}
                          className="tool-btn"
                          title="Rename Room"
                          style={{ width: 22, height: 22, padding: 0 }}
                        >
                          <Edit3 size={11} color="var(--text-muted)" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => navigateToRoom(room.id)}
                      className="btn-primary"
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {room.id === roomId ? 'Current' : 'Join →'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
