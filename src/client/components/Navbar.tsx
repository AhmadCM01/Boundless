import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { BrandLogo } from './BrandLogo';
import { ExportMenu } from './ExportMenu';
import { Share2, Check, Wifi, WifiOff, Sun, Moon, LogOut, History, Eye, Edit3, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        top: 12,
        left: 12,
        right: 12,
        height: 56,
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        overflow: 'visible',
        gap: 8,
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 1000,
      }}
    >
      {/* Brand & Room Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <BrandLogo size={26} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-heading)' }}>
            Boundless
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--bg-panel-border)', flexShrink: 0 }} />

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
            gap: 6,
            padding: '4px 10px',
            borderRadius: 10,
            border: '1px solid var(--bg-panel-border)',
            background: 'var(--btn-hover-bg)',
            height: 36,
            width: 'auto',
            maxWidth: 160,
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          <span className="hide-on-mobile" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Room:</span>
          <span
            className="room-title-text"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-main)',
              fontFamily: 'Inter',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 110,
            }}
          >
            {roomTitle}
          </span>
          <Edit3 size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 8px', borderRadius: 20, flexShrink: 0 }} className="glass-pill">
          {isConnected ? (
            <>
              <Wifi size={14} color="#10b981" />
              <span className="hide-on-mobile" style={{ color: '#10b981', fontWeight: 600 }}>Live Sync</span>
            </>
          ) : (
            <>
              <WifiOff size={14} color="#ef4444" />
              <span className="hide-on-mobile" style={{ color: '#ef4444', fontWeight: 600 }}>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls (Desktop Only) */}
      <div className="desktop-only-control" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {followingUserId && (
          <button
            onClick={() => setFollowingUserId(null)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Eye size={14} />
            <span>Following User (Click to Stop)</span>
          </button>
        )}

        {/* Online Collaborator Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 4, flexShrink: 0 }}>
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
              flexShrink: 0,
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
                flexShrink: 0,
              }}
            >
              {user.username ? user.username.substring(0, 2).toUpperCase() : 'G'}
            </div>
          ))}
        </div>

        {/* Export Menu */}
        <div style={{ flexShrink: 0 }}>
          <ExportMenu stageRef={stageRef} />
        </div>

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
            flexShrink: 0,
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
            flexShrink: 0,
          }}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Share Button */}
        <button
          onClick={copyInviteLink}
          className="btn-primary"
          title={copied ? 'Link Copied!' : 'Share Room Link'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, height: 38, padding: '0 12px', flexShrink: 0 }}
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
            flexShrink: 0,
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Hamburger Toggle Button (Mobile Only) */}
      <button
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        className="tool-btn mobile-only-control"
        title="Toggle Menu Drawer"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: '1px solid var(--bg-panel-border)',
          background: 'var(--btn-hover-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isMobileMenuOpen ? <X size={20} color="var(--text-main)" /> : <Menu size={20} color="var(--text-main)" />}
      </button>

      {/* Invisible Fullscreen Backdrop for Outside Clicks */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* Mobile Collapsible Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div
          className="glass-panel animate-fade-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 60,
            right: 0,
            width: 220,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            zIndex: 99999,
            borderRadius: 14,
            border: '1px solid var(--bg-panel-border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            background: 'var(--bg-panel)',
          }}
        >
          {/* Collaborator Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--bg-panel-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active Users</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                title={`You: ${username || 'Guest'}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor: userColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {username ? username.substring(0, 2).toUpperCase() : 'ME'}
              </div>
              {onlineUsers.map((u, i) => (
                <div
                  key={u.userId || i}
                  title={u.username}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: u.color || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {u.username ? u.username.substring(0, 2).toUpperCase() : 'G'}
                </div>
              ))}
            </div>
          </div>

          {/* Share Room Button */}
          <button
            onClick={() => {
              copyInviteLink();
              setIsMobileMenuOpen(false);
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, height: 38, width: '100%', justifyContent: 'center' }}
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copied ? 'Link Copied!' : 'Share Room Link'}</span>
          </button>

          {/* Export Menu Item */}
          <div style={{ width: '100%' }} onClick={() => setIsMobileMenuOpen(false)}>
            <ExportMenu stageRef={stageRef} />
          </div>

          {/* Session Replay */}
          <button
            onClick={() => {
              onOpenReplay();
              setIsMobileMenuOpen(false);
            }}
            className="tool-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, width: '100%', justifyContent: 'flex-start' }}
          >
            <History size={16} />
            <span>Session Replay</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              toggleTheme();
              setIsMobileMenuOpen(false);
            }}
            className="tool-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, width: '100%', justifyContent: 'flex-start' }}
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="tool-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
          >
            <LogOut size={16} />
            <span>Log Out Session</span>
          </button>
        </div>
      )}

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
