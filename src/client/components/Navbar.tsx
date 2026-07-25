import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Share2, Check, Sparkles, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { roomId, username, userColor, onlineUsers, isConnected, setUsername } = useRoom();
  const [copied, setCopied] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempName, setTempName] = useState(username || '');

  // Persisted Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('boundless_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boundless_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUsername(tempName.trim());
      setIsEditingUsername(false);
    }
  };

  return (
    <header className="glass-panel" style={{
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px var(--accent-glow)'
        }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-heading)',
          }}>
            Boundless
          </h1>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Room: {roomId}</span>
          </div>
        </div>
      </div>

      {/* Center Status Pill */}
      <div className="glass-pill" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {isConnected ? (
          <>
            <Wifi size={14} color="#10b981" />
            <span style={{ color: '#10b981', fontWeight: 500 }}>Live Sync</span>
          </>
        ) : (
          <>
            <WifiOff size={14} color="#ef4444" />
            <span style={{ color: '#ef4444', fontWeight: 500 }}>Offline / Reconnecting</span>
          </>
        )}
      </div>

      {/* Right Controls & Collaborators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Active Collaborator Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
          <div
            title={`You (${username}) — Click to rename`}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: userColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              border: '2px solid var(--bg-dark)',
              cursor: 'pointer',
            }}
            onClick={() => {
              setTempName(username || '');
              setIsEditingUsername(true);
            }}
          >
            {username ? username.substring(0, 2).toUpperCase() : '?'}
          </div>

          {onlineUsers.map((user, idx) => (
            <div
              key={user.userId || idx}
              title={user.username}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: user.color || '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                border: '2px solid var(--bg-dark)',
                marginLeft: -8,
              }}
            >
              {user.username ? user.username.substring(0, 2).toUpperCase() : 'G'}
            </div>
          ))}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="tool-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid var(--bg-panel-border)',
            background: 'var(--btn-hover-bg)',
          }}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Share Button */}
        <button
          onClick={copyInviteLink}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, height: 40 }}
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          <span>{copied ? 'Link Copied!' : 'Share Room'}</span>
        </button>
      </div>

      {/* Edit Username Modal Overlay */}
      {isEditingUsername && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--modal-backdrop)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <form onSubmit={handleSaveUsername} className="glass-panel" style={{ padding: 24, width: 340, borderRadius: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text-heading)' }}>Change Guest Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter username..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--input-border)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                marginBottom: 16,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditingUsername(false)}
                style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-muted)', fontSize: 13 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
