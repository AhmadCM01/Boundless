import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomDockProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  setStageX: (x: number) => void;
  setStageY: (y: number) => void;
}

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;

export const ZoomDock: React.FC<ZoomDockProps> = ({ zoom, setZoom, setStageX, setStageY }) => {
  const clamp = (v: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v));

  const zoomIn = () => {
    const next = clamp(Math.round((zoom + ZOOM_STEP) * 100) / 100);
    setZoom(next);
  };

  const zoomOut = () => {
    const next = clamp(Math.round((zoom - ZOOM_STEP) * 100) / 100);
    setZoom(next);
  };

  const resetView = () => {
    setZoom(1);
    setStageX(0);
    setStageY(0);
  };

  const pct = Math.round(zoom * 100);

  return (
    <div
      className="glass-panel zoom-dock"
      onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        height: 44,
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        zIndex: 9999,
        pointerEvents: 'auto',
        borderRadius: 12,
      }}
    >
      <button
        className="tool-btn"
        title="Zoom Out (−)"
        onClick={zoomOut}
        disabled={zoom <= ZOOM_MIN}
        style={{ width: 30, height: 30, borderRadius: 8, opacity: zoom <= ZOOM_MIN ? 0.4 : 1 }}
      >
        <ZoomOut size={15} />
      </button>

      <button
        title="Reset View (100%)"
        onClick={resetView}
        style={{
          minWidth: 52,
          height: 30,
          borderRadius: 8,
          background: 'transparent',
          border: '1px solid var(--bg-panel-border)',
          color: 'var(--text-main)',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          padding: '0 6px',
          letterSpacing: '-0.02em',
        }}
      >
        {pct}%
      </button>

      <button
        className="tool-btn"
        title="Zoom In (+)"
        onClick={zoomIn}
        disabled={zoom >= ZOOM_MAX}
        style={{ width: 30, height: 30, borderRadius: 8, opacity: zoom >= ZOOM_MAX ? 0.4 : 1 }}
      >
        <ZoomIn size={15} />
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--bg-panel-border)', margin: '0 2px' }} />

      <button
        className="tool-btn"
        title="Fit to Screen"
        onClick={resetView}
        style={{ width: 30, height: 30, borderRadius: 8 }}
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
};
