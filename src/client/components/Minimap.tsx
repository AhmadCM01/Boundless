import React from 'react';
import { useRoom } from '../context/RoomContext';

interface MinimapProps {
  stageX: number;
  stageY: number;
  zoom: number;
}

export const Minimap: React.FC<MinimapProps> = ({ stageX, stageY, zoom }) => {
  const { canvasObjects, onlineUsers } = useRoom();

  const MINIMAP_WIDTH = 180;
  const MINIMAP_HEIGHT = 120;
  const VIRTUAL_BOUNDS = 4000; // Total world coordinate range for minimap

  // Map world coordinate (x, y) to minimap pixel coordinate
  const toMinimapX = (worldX: number) => {
    return ((worldX + VIRTUAL_BOUNDS / 2) / VIRTUAL_BOUNDS) * MINIMAP_WIDTH;
  };

  const toMinimapY = (worldY: number) => {
    return ((worldY + VIRTUAL_BOUNDS / 2) / VIRTUAL_BOUNDS) * MINIMAP_HEIGHT;
  };

  // User's viewport rectangle on minimap
  const viewMinX = toMinimapX((0 - stageX) / zoom);
  const viewMinY = toMinimapY((0 - stageY) / zoom);
  const viewWidth = (window.innerWidth / zoom / VIRTUAL_BOUNDS) * MINIMAP_WIDTH;
  const viewHeight = (window.innerHeight / zoom / VIRTUAL_BOUNDS) * MINIMAP_HEIGHT;

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: MINIMAP_WIDTH,
        height: MINIMAP_HEIGHT,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--minimap-border)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--minimap-bg)' }}>
        {/* Render Canvas Objects as Tiny Dots */}
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
              backgroundColor: obj.type === 'sticky' ? '#eab308' : obj.type === 'audio' ? '#a855f7' : '#6366f1',
              opacity: 0.8,
            }}
          />
        ))}

        {/* Online Collaborator Cursors on Radar */}
        {onlineUsers.map((u, i) => (
          u.cursor && (
            <div
              key={u.userId || i}
              style={{
                position: 'absolute',
                left: toMinimapX(u.cursor.x),
                top: toMinimapY(u.cursor.y),
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: u.color || '#3b82f6',
                boxShadow: `0 0 6px ${u.color || '#3b82f6'}`,
              }}
            />
          )
        ))}

        {/* Current Camera Viewport Rect */}
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
