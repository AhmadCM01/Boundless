import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Sparkles, User, ArrowRight } from 'lucide-react';

export const GuestModal: React.FC = () => {
  const { username, setUsername, userColor } = useRoom();
  const [inputName, setInputName] = useState('');

  if (username) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUsername(inputName.trim());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: 380,
        padding: 32,
        borderRadius: 24,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(99, 102, 241, 0.5)'
        }}>
          <Sparkles size={28} color="#fff" />
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Join Boundless
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Enter a username to start collaborating live on this infinite canvas.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
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
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: '#fff',
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
              height: 48,
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
      </div>
    </div>
  );
};
