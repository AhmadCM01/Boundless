import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Trash2, ArrowUp, ArrowDown, Edit3 } from 'lucide-react';

interface Props {
  selectedId: string | null;
  onDeselect: () => void;
  stageX?: number;
  stageY?: number;
  zoom?: number;
}

const COLOR_SWATCHES = [
  { name: 'Charcoal', value: '#1e293b' },
  { name: 'Rose Red', value: '#e11d48' },
  { name: 'Coral', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky Blue', value: '#0284c7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cream', value: '#fef08a' },
  { name: 'White', value: '#f8fafc' },
];

export const ColorPickerBar: React.FC<Props> = ({
  selectedId,
  onDeselect,
  stageX = 0,
  stageY = 0,
  zoom = 1,
}) => {
  const { canvasObjects, updateObject, deleteObject } = useRoom();

  if (!selectedId) return null;

  const activeObj = canvasObjects.get(selectedId);
  if (!activeObj) return null;

  const currentColor =
    (activeObj as any).fill || (activeObj as any).color || (activeObj as any).stroke || '#6366f1';

  const isTextOrSticky = activeObj.type === 'text' || activeObj.type === 'sticky';

  const handleSelectColor = (colorValue: string) => {
    if (activeObj.type === 'shape') {
      updateObject(selectedId, { fill: colorValue, stroke: colorValue });
    } else if (activeObj.type === 'sticky') {
      updateObject(selectedId, { color: colorValue });
    } else if (activeObj.type === 'text') {
      updateObject(selectedId, { fill: colorValue });
    } else if (activeObj.type === 'pen') {
      updateObject(selectedId, { stroke: colorValue });
    }
  };

  const handleTriggerEdit = () => {
    const event = new CustomEvent('boundless-trigger-text-edit', { detail: { id: selectedId } });
    window.dispatchEvent(event);
  };

  const handleBringToFront = () => {
    const allZ = Array.from(canvasObjects.values()).map((o) => o.zIndex || 0);
    const maxZ = Math.max(...allZ, 0);
    updateObject(selectedId, { zIndex: maxZ + 1 });
  };

  const handleSendToBack = () => {
    const allZ = Array.from(canvasObjects.values()).map((o) => o.zIndex || 0);
    const minZ = Math.min(...allZ, 0);
    updateObject(selectedId, { zIndex: minZ - 1 });
  };

  const handleDelete = () => {
    deleteObject(selectedId);
    onDeselect();
  };

  // Calculate object's screen position so toolbar floats directly 14px above bounding box
  const safeZoom = zoom || 1;
  const safeStageX = stageX || 0;
  const safeStageY = stageY || 0;

  const objW = activeObj.width || 120;
  const centerWorldX = activeObj.x + objW / 2;
  const topWorldY = activeObj.y;

  const rawScreenX = centerWorldX * safeZoom + safeStageX;
  const rawScreenY = topWorldY * safeZoom + safeStageY - 14;

  // Clamped position to keep toolbar visible within screen boundaries
  const screenX = Math.max(160, Math.min((typeof window !== 'undefined' ? window.innerWidth : 1200) - 160, rawScreenX));
  const screenY = Math.max(85, Math.min((typeof window !== 'undefined' ? window.innerHeight : 800) - 60, rawScreenY));

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, -100%)',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '92vw',
        overflowX: 'auto',
        zIndex: 200,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Edit Text Button for Text and Sticky Objects */}
      {isTextOrSticky && (
        <>
          <button
            onClick={handleTriggerEdit}
            className="btn-primary"
            style={{
              padding: '5px 12px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              height: 28,
            }}
          >
            <Edit3 size={14} />
            <span>Edit Text</span>
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--bg-panel-border)', margin: '0 2px', flexShrink: 0 }} />
        </>
      )}

      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        Color
      </span>

      {/* Swatch Palette */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        {COLOR_SWATCHES.map((swatch) => {
          const isSelected = currentColor === swatch.value;
          return (
            <button
              key={swatch.value}
              title={swatch.name}
              onClick={() => handleSelectColor(swatch.value)}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: swatch.value,
                border: isSelected ? '2px solid var(--text-heading)' : '1px solid rgba(0, 0, 0, 0.2)',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                boxShadow: isSelected ? '0 0 6px rgba(0,0,0,0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            />
          );
        })}

        {/* Custom Native Color Picker */}
        <label
          title="Custom Hex Color Picker"
          style={{
            position: 'relative',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 0 6px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        >
          <input
            type="color"
            value={currentColor.startsWith('#') ? currentColor : '#6366f1'}
            onChange={(e) => handleSelectColor(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
            }}
          />
        </label>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--bg-panel-border)', margin: '0 2px', flexShrink: 0 }} />

      {/* Layering Z-Index Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <button
          title="Bring to Front"
          onClick={handleBringToFront}
          className="tool-btn"
          style={{ width: 26, height: 26 }}
        >
          <ArrowUp size={13} />
        </button>
        <button
          title="Send to Back"
          onClick={handleSendToBack}
          className="tool-btn"
          style={{ width: 26, height: 26 }}
        >
          <ArrowDown size={13} />
        </button>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--bg-panel-border)', margin: '0 2px', flexShrink: 0 }} />

      {/* Delete Selected Object Button */}
      <button
        title="Delete Selected Object"
        onClick={handleDelete}
        style={{
          background: 'transparent',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 500,
          padding: '3px 6px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <Trash2 size={15} />
        <span>Delete</span>
      </button>
    </div>
  );
};
