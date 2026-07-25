import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Trash2 } from 'lucide-react';

interface Props {
  selectedId: string | null;
  onDeselect: () => void;
}

const COLOR_SWATCHES = [
  { name: 'Charcoal', value: '#1e293b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
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
        top: 92,
        left: '50%',
        transform: 'translateX(-50%)',
        height: 48,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 100,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Color
      </span>

      {/* Swatch Palette */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {COLOR_SWATCHES.map((swatch) => {
          const isSelected = currentColor === swatch.value;
          return (
            <button
              key={swatch.value}
              title={swatch.name}
              onClick={() => handleSelectColor(swatch.value)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: swatch.value,
                border: isSelected ? '2px solid var(--text-heading)' : '1px solid rgba(0, 0, 0, 0.2)',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            />
          );
        })}
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--bg-panel-border)', margin: '0 4px' }} />

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
        }}
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
};
