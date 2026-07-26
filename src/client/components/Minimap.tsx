import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Map, Minimize2, Maximize2 } from 'lucide-react';

interface MinimapProps {
  stageX: number;
  stageY: number;
  zoom: number;
}

export const Minimap: React.FC<MinimapProps> = ({ stageX, stageY, zoom }) => {
  const { canvasObjects, onlineUsers } = useRoom();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const MINIMAP_WIDTH = isMobile ? 120 : 180;
  const MINIMAP_HEIGHT = isMobile ? 80 : 120;
  const VIRTUAL_BOUNDS = 4000;

  const safeZoom = zoom || 1;
  const safeStageX = stageX || 0;
  const safeStageY = stageY || 0;

  const toMinimapX = (worldX: number) => {
    return ((worldX + VIRTUAL_BOUNDS / 2) / VIRTUAL_BOUNDS) * MINIMAP_WIDTH;
  };

  const toMinimapY = (worldY: number) => {
    return ((worldY + VIRTUAL_BOUNDS / 2) / VIRTUAL_BOUNDS) * MINIMAP_HEIGHT;
  };

  const viewMinX = toMinimapX((0 - safeStageX) / safeZoom);
  const viewMinY = toMinimapY((0 - safeStageY) / safeZoom);
  const viewWidth = ((typeof window !== 'undefined' ? window.innerWidth : 1200) / safeZoom / VIRTUAL_BOUNDS) * MINIMAP_WIDTH;
  const viewHeight = ((typeof window !== 'undefined' ? window.innerHeight : 800) / safeZoom / VIRTUAL_BOUNDS) * MINIMAP_HEIGHT;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="glass-panel minimap-dock"
        title="Show Minimap Radar"
        style={{
          position: 'fixed',
          bottom: isMobile ? 88 : 24,
          right: isMobile ? 12 : 24,
          width: 36,
          height: 36,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          cursor: 'pointer',
        }}
      >
        <Map size={18} color="var(--accent-primary)" />
      </button>
    );
  }

  return (
    <div
      className="glass-panel minimap-dock"
      style={{
        position: 'fixed',
        bottom: isMobile ? 88 : 24,
        right: isMobile ? 12 : 24,
        width: MINIMAP_WIDTH,
        height: MINIMAP_HEIGHT,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--minimap-border)',
        zIndex: 9999,
      }}
    >
      {/* Minimize Toggle Button */}
      <button
        onClick={() => setIsMinimized(true)}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        <Minimize2 size={12} />
      </button>

      <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--minimap-bg)' }}>
        {/* Canvas Objects */}
        {Array.from(canvasObjects.values()).map((obj) => (
          <div
            key={obj.id}
            style={{
              position: 'absolute',
              left: Math.max(0, Math.min(MINIMAP_WIDTH - 4, toMinimapX(obj.x))),
              top: Math.max(0, Math.min(MINIMAP_HEIGHT - 4, toMinimapY(obj.y))),
              width: 4,
              height: 4,
              borderRadius: 1,
              backgroundColor: (obj as any).fill || (obj as any).color || (obj as any).stroke || '#6366f1',
              opacity: 0.8,
            }}
          />
        ))}

        {/* Collaborators' Viewports */}
        {onlineUsers.map((u, i) => {
          if (!u.viewport) return null;
          const uViewMinX = toMinimapX((0 - u.viewport.x) / (u.viewport.zoom || 1));
          const uViewMinY = toMinimapY((0 - u.viewport.y) / (u.viewport.zoom || 1));
          const uViewWidth = (u.viewport.width / (u.viewport.zoom || 1) / VIRTUAL_BOUNDS) * MINIMAP_WIDTH;
          const uViewHeight = (u.viewport.height / (u.viewport.zoom || 1) / VIRTUAL_BOUNDS) * MINIMAP_HEIGHT;

          return (
            <div
              key={`vp_${u.userId || i}`}
              title={`${u.username}'s Viewport`}
              style={{
                position: 'absolute',
                left: Math.max(0, Math.min(MINIMAP_WIDTH, uViewMinX)),
                top: Math.max(0, Math.min(MINIMAP_HEIGHT, uViewMinY)),
                width: Math.max(8, Math.min(MINIMAP_WIDTH, uViewWidth)),
                height: Math.max(8, Math.min(MINIMAP_HEIGHT, uViewHeight)),
                border: `1.5px dashed ${u.color || '#3b82f6'}`,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderRadius: 4,
              }}
            />
          );
        })}

        {/* Camera Viewport Rect */}
        <div
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(MINIMAP_WIDTH, viewMinX)),
            top: Math.max(0, Math.min(MINIMAP_HEIGHT, viewMinY)),
            width: Math.min(MINIMAP_WIDTH, viewWidth),
            height: Math.min(MINIMAP_HEIGHT, viewHeight),
            border: '1.5px solid var(--accent-primary)',
            backgroundColor: 'var(--accent-glow)',
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
};
