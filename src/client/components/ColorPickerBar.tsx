import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Trash2, Pipette } from 'lucide-react';

interface Props {
  selectedId: string | null;
  onDeselect: () => void;
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

export const ColorPickerBar: React.FC<Props> = ({ selectedId, onDeselect }) => {
  const { canvasObjects, updateObject, deleteObject } = useRoom();

  if (!selectedId) return null;

  const activeObj = canvasObjects.get(selectedId);
  if (!activeObj) return null;

  const currentColor =
    (activeObj as any).fill || (activeObj as any).color || '#6366f1';

  const handleSelectColor = (colorValue: string) => {
    if (activeObj.type === 'shape') {
      updateObject(selectedId, { fill: colorValue, stroke: colorValue });
    } else if (activeObj.type === 'sticky') {
      updateObject(selectedId, { color: colorValue });
    } else if (activeObj.type === 'text') {
      updateObject(selectedId, { fill: colorValue });
    }
  };

  const handleDelete = () => {
    deleteObject(selectedId);
    onDeselect();
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        top: 88,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: '92vw',
        overflowX: 'auto',
        zIndex: 100,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        Color
      </span>

      {/* Swatch Palette */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {COLOR_SWATCHES.map((swatch) => {
          const isSelected = currentColor === swatch.value;
          return (
            <button
              key={swatch.value}
              title={swatch.name}
              onClick={() => handleSelectColor(swatch.value)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: swatch.value,
                border: isSelected ? '2px solid var(--text-heading)' : '1px solid rgba(0, 0, 0, 0.2)',
                transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
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
            width: 24,
            height: 24,
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

      <div style={{ width: 1, height: 20, background: 'var(--bg-panel-border)', margin: '0 4px', flexShrink: 0 }} />

      {/* Delete Selected Object Button */}
      <button
        title="Delete Selected Object"
        onClick={handleDelete}
        style={{
          background: 'transparent',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
};
