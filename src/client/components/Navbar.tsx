import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { BrandLogo } from './BrandLogo';
import { ExportMenu } from './ExportMenu';
import { Share2, Check, Wifi, WifiOff, Sun, Moon, LogOut, History, Eye, Edit3 } from 'lucide-react';
import Konva from 'konva';

interface NavbarProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  onOpenReplay: () => void;
  followingUserId: string | null;
  setFollowingUserId: (id: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stageRef,
  onOpenReplay,
  followingUserId,
  setFollowingUserId,
}) => {
  const { roomId, username, userColor, onlineUsers, isConnected, setUsername, logout } = useRoom();
  const [copied, setCopied] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempName, setTempName] = useState(username || '');

  // Room Title Customization State
  const [roomTitle, setRoomTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('boundless_room_titles');
      if (saved) {
        const map = JSON.parse(saved);
        return map[roomId] || roomId;
      }
    } catch (e) {}
    return roomId;
  });
  const [isEditingRoomTitle, setIsEditingRoomTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(roomTitle);

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

  const handleSaveRoomTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      setRoomTitle(tempTitle.trim());
      try {
        const saved = localStorage.getItem('boundless_room_titles');
        const map = saved ? JSON.parse(saved) : {};
        map[roomId] = tempTitle.trim();
        localStorage.setItem('boundless_room_titles', JSON.stringify(map));
      } catch (e) {}
      setIsEditingRoomTitle(false);
    }
  };

  return (
    <header
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 16,
        left: 24,
        right: 24,
        height: 64,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
      }}
    >
      {/* Brand & Room Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={28} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-heading)' }}>
            Boundless
          </span>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--bg-panel-border)' }} />

        {/* Room Title Badge (Editable) */}
        <button
          onClick={() => {
            setTempTitle(roomTitle);
            setIsEditingRoomTitle(true);
          }}
          className="tool-btn"
          title="Click to rename room context"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 10,
            border: '1px solid var(--bg-panel-border)',
            background: 'var(--btn-hover-bg)',
            height: 36,
            width: 'auto',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Room:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'Inter' }}>
            {roomTitle}
          </span>
          <Edit3 size={13} color="var(--text-muted)" />
        </button>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 10px', borderRadius: 20 }} className="glass-pill">
          {isConnected ? (
            <>
              <Wifi size={14} color="#10b981" />
              <span style={{ color: '#10b981', fontWeight: 600 }}>Live Sync</span>
            </>
          ) : (
            <>
              <WifiOff size={14} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 600 }}>Offline / Reconnecting</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {followingUserId && (
          <button
            onClick={() => setFollowingUserId(null)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Eye size={14} />
            <span>Following User (Click to Stop)</span>
          </button>
        )}

        {/* Online Collaborator Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 6 }}>
          <div
            title={`You: ${username || 'Guest'} (Click to edit)`}
            onClick={() => {
              setTempName(username || '');
              setIsEditingUsername(true);
            }}
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
              boxShadow: '0 0 8px rgba(0,0,0,0.3)',
            }}
          >
            {username ? username.substring(0, 2).toUpperCase() : 'ME'}
          </div>

          {onlineUsers.map((user, idx) => (
            <div
              key={user.userId || idx}
              title={`Click to Follow ${user.username || 'Collaborator'}`}
              onClick={() => setFollowingUserId(user.userId || null)}
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
                cursor: 'pointer',
              }}
            >
              {user.username ? user.username.substring(0, 2).toUpperCase() : 'G'}
            </div>
          ))}
        </div>

        {/* Export Menu */}
        <ExportMenu stageRef={stageRef} />

        {/* Session Replay Button */}
        <button
          onClick={onOpenReplay}
          className="tool-btn"
          title="Session Replay & Time Travel"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid var(--bg-panel-border)',
            background: 'var(--btn-hover-bg)',
          }}
        >
          <History size={18} />
        </button>

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

        {/* Log Out Button */}
        <button
          onClick={logout}
          className="tool-btn"
          title="Log Out (Clear Guest Session)"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid var(--bg-panel-border)',
            background: 'var(--btn-hover-bg)',
            color: '#ef4444',
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Edit Room Title Modal */}
      {isEditingRoomTitle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--modal-backdrop)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <form
            onSubmit={handleSaveRoomTitle}
            className="glass-panel animate-fade-in"
            style={{ width: 380, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>Rename Canvas Room</h3>
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              placeholder="e.g. Q3 Product Strategy..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-input)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-main)',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditingRoomTitle(false)}
                className="tool-btn"
                style={{ padding: '8px 16px', width: 'auto', height: 'auto', fontSize: 13 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                Save Title
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Username Modal */}
      {isEditingUsername && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--modal-backdrop)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <form
            onSubmit={handleSaveUsername}
            className="glass-panel animate-fade-in"
            style={{ width: 340, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <h3 style={{ fontSize: 18, color: 'var(--text-heading)' }}>Edit Display Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--bg-input)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-main)',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditingUsername(false)}
                className="tool-btn"
                style={{ padding: '8px 16px', width: 'auto', height: 'auto', fontSize: 13 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
