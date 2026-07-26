import React, { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { CanvasObject, TextObject } from '../../shared/types';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Group as GroupIcon,
  Ungroup,
  X,
  Type,
  Square,
  Palette,
  GripHorizontal,
  Edit3,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedIds: string[];
  selectedId: string | null;
  onDeselect: () => void;
}

const COLOR_SWATCHES = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#e5e7eb', '#1f2937'
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedIds,
  selectedId,
  onDeselect,
}) => {
  const { canvasObjects, updateObject, deleteObject, doc } = useRoom();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const activeIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
  if (activeIds.length === 0) return null;

  const targetObjs = activeIds.map((id) => canvasObjects.get(id)).filter(Boolean) as CanvasObject[];
  if (targetObjs.length === 0) return null;

  const firstObj = targetObjs[0];
  const isMultiple = targetObjs.length > 1;
  const firstGroupId = firstObj?.groupId;
  const isAllGrouped = Boolean(firstGroupId) && targetObjs.every((o) => o.groupId === firstGroupId);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    const rect = (e.currentTarget as HTMLElement).closest('.glass-panel')?.getBoundingClientRect();
    if (rect) {
      initialPos.current = { x: rect.left, y: rect.top };
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 300, initialPos.current.x + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 300, initialPos.current.y + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Trigger Edit Modal for Text / Sticky
  const handleTriggerEdit = () => {
    if (firstObj) {
      const event = new CustomEvent('boundless-trigger-text-edit', { detail: { id: firstObj.id } });
      window.dispatchEvent(event);
    }
  };

  // Bring to Front
  const handleBringToFront = () => {
    if (!doc) return;
    const allZ = Array.from(canvasObjects.values()).map((o) => o.zIndex || 0);
    const maxZ = Math.max(...allZ, 0);
    doc.transact(() => {
      activeIds.forEach((id, idx) => updateObject(id, { zIndex: maxZ + idx + 1 }));
    });
  };

  // Send to Back
  const handleSendToBack = () => {
    if (!doc) return;
    const allZ = Array.from(canvasObjects.values()).map((o) => o.zIndex || 0);
    const minZ = Math.min(...allZ, 0);
    doc.transact(() => {
      activeIds.forEach((id, idx) => updateObject(id, { zIndex: minZ - idx - 1 }));
    });
  };

  // Group / Ungroup Actions
  const handleGroup = () => {
    if (!doc) return;
    const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    doc.transact(() => {
      activeIds.forEach((id) => updateObject(id, { groupId: newGroupId }));
    });
  };

  const handleUngroup = () => {
    if (!doc) return;
    doc.transact(() => {
      activeIds.forEach((id) => updateObject(id, { groupId: undefined }));
    });
  };

  // Delete Selection Action
  const handleDeleteSelection = () => {
    if (!doc) return;
    doc.transact(() => {
      activeIds.forEach((id) => deleteObject(id));
    });
    onDeselect();
  };

  // Bulk Property Updater
  const applyPatch = (patch: Partial<CanvasObject>) => {
    if (!doc) return;
    doc.transact(() => {
      activeIds.forEach((id) => updateObject(id, patch));
    });
  };

  return (
    <div
      className="glass-panel animate-fade-in properties-panel-dock"
      style={{
        position: 'absolute',
        top: position ? position.y : 76,
        left: position ? position.x : undefined,
        right: position ? undefined : 12,
        width: 280,
        maxHeight: 'calc(100dvh - 160px)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 150,
        borderRadius: 14,
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {/* Draggable Header Handle Bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--bg-panel-border)',
          paddingBottom: 8,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
        title="Click and drag to move panel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GripHorizontal size={16} color="var(--text-muted)" />
          {firstObj.type === 'text' ? <Type size={16} color="var(--accent-primary)" /> : <Square size={16} color="var(--accent-primary)" />}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
            {isMultiple ? `${targetObjs.length} Items` : `${firstObj.type.toUpperCase()} Properties`}
          </span>
        </div>
        <button onClick={onDeselect} className="tool-btn" style={{ width: 26, height: 26 }} title="Close Properties">
          <X size={14} />
        </button>
      </div>

      {/* Primary Action Buttons (Edit Text, Layering) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {(firstObj.type === 'text' || firstObj.type === 'sticky') && (
          <button
            onClick={handleTriggerEdit}
            className="btn-primary"
            style={{ flex: 1, height: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Edit3 size={14} />
            <span>Edit Text</span>
          </button>
        )}

        <button
          onClick={handleBringToFront}
          className="tool-btn"
          style={{ width: 32, height: 32 }}
          title="Bring to Front"
        >
          <ArrowUp size={15} />
        </button>

        <button
          onClick={handleSendToBack}
          className="tool-btn"
          style={{ width: 32, height: 32 }}
          title="Send to Back"
        >
          <ArrowDown size={15} />
        </button>
      </div>

      {/* Grouping Actions */}
      {(isMultiple || firstGroupId) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {!isAllGrouped && isMultiple && (
            <button onClick={handleGroup} className="btn-primary" style={{ flex: 1, height: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <GroupIcon size={14} />
              <span>Group</span>
            </button>
          )}
          {firstGroupId && (
            <button onClick={handleUngroup} className="tool-btn" style={{ flex: 1, height: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#f59e0b', border: '1px solid var(--bg-panel-border)' }}>
              <Ungroup size={14} />
              <span>Ungroup</span>
            </button>
          )}
        </div>
      )}

      {/* Text Formatting Controls */}
      {(firstObj.type === 'text' || firstObj.type === 'sticky') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Typography</span>
          
          {/* Font Size & Bold/Italic/Underline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={12}
              max={96}
              value={(firstObj as TextObject).fontSize || 20}
              onChange={(e) => applyPatch({ fontSize: Number(e.target.value) || 20 })}
              style={{
                width: 60,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--bg-panel-border)',
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
              }}
              title="Font Size"
            />

            <button
              onClick={() => applyPatch({ fontWeight: (firstObj as TextObject).fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`tool-btn ${(firstObj as TextObject).fontWeight === 'bold' ? 'active' : ''}`}
              style={{ width: 32, height: 32 }}
              title="Bold"
            >
              <Bold size={15} />
            </button>

            <button
              onClick={() => applyPatch({ fontStyle: (firstObj as TextObject).fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`tool-btn ${(firstObj as TextObject).fontStyle === 'italic' ? 'active' : ''}`}
              style={{ width: 32, height: 32 }}
              title="Italic"
            >
              <Italic size={15} />
            </button>

            <button
              onClick={() => applyPatch({ textDecoration: (firstObj as TextObject).textDecoration === 'underline' ? 'none' : 'underline' })}
              className={`tool-btn ${(firstObj as TextObject).textDecoration === 'underline' ? 'active' : ''}`}
              style={{ width: 32, height: 32 }}
              title="Underline"
            >
              <Underline size={15} />
            </button>
          </div>

          {/* Text Alignment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => applyPatch({ textAlign: 'left' })}
              className={`tool-btn ${(firstObj as TextObject).textAlign === 'left' || !(firstObj as TextObject).textAlign ? 'active' : ''}`}
              style={{ flex: 1, height: 30 }}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => applyPatch({ textAlign: 'center' })}
              className={`tool-btn ${(firstObj as TextObject).textAlign === 'center' ? 'active' : ''}`}
              style={{ flex: 1, height: 30 }}
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => applyPatch({ textAlign: 'right' })}
              className={`tool-btn ${(firstObj as TextObject).textAlign === 'right' ? 'active' : ''}`}
              style={{ flex: 1, height: 30 }}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Color Picker Swatches */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette size={13} color="var(--text-muted)" />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Color Palette</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              onClick={() => {
                if (firstObj.type === 'text') applyPatch({ fill: color });
                else if (firstObj.type === 'shape') applyPatch({ fill: color, stroke: color });
                else if (firstObj.type === 'sticky') applyPatch({ color });
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid var(--bg-dark)',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
              title={`Set color: ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Delete Action */}
      <div style={{ paddingTop: 8, borderTop: '1px solid var(--bg-panel-border)' }}>
        <button
          onClick={handleDeleteSelection}
          className="tool-btn"
          style={{ width: '100%', height: 34, color: '#ef4444', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}
          title="Delete Selected Item(s)"
        >
          <Trash2 size={16} />
          <span>Delete Selection</span>
        </button>
      </div>
    </div>
  );
};
