import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { CanvasObject, TextObject, ShapeObject, StickyObject } from '../../shared/types';
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
  Zap,
  Sliders,
} from 'lucide-react';

interface LeftSidebarProps {
  selectedIds: string[];
  selectedId: string | null;
  onDeselect: () => void;
  stageX?: number;
  stageY?: number;
  zoom?: number;
}

const COLOR_SWATCHES = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#e5e7eb', '#1f2937', '#ffffff'
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  selectedIds,
  selectedId,
  onDeselect,
  stageX = 0,
  stageY = 0,
  zoom = 1,
}) => {
  const { canvasObjects, updateObject, deleteObject, addObject, username, doc } = useRoom();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [fontSizeInput, setFontSizeInput] = useState<string>('20');
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const activeIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
  const targetObjs = activeIds.map((id) => canvasObjects.get(id)).filter(Boolean) as CanvasObject[];
  const firstObj = targetObjs[0];
  const isMultiple = targetObjs.length > 1;
  const firstGroupId = firstObj?.groupId;
  const isAllGrouped = Boolean(firstGroupId) && targetObjs.every((o) => o.groupId === firstGroupId);

  // Synchronize font size input when selected object changes
  useEffect(() => {
    if (firstObj) {
      setFontSizeInput(String((firstObj as TextObject)?.fontSize || 20));
    }
  }, [firstObj?.id]);

  if (activeIds.length === 0 || targetObjs.length === 0) return null;

  // Pointer Drag Handlers
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

  // Bulk Property Updater
  const applyPatch = (patch: Partial<CanvasObject>) => {
    if (!doc || activeIds.length === 0) return;
    doc.transact(() => {
      activeIds.forEach((id) => updateObject(id, patch));
    });
  };

  // Group / Ungroup Actions
  const handleGroup = () => {
    if (!doc || activeIds.length === 0) return;
    const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    doc.transact(() => {
      activeIds.forEach((id) => updateObject(id, { groupId: newGroupId }));
    });
  };

  const handleUngroup = () => {
    if (!doc || activeIds.length === 0) return;
    doc.transact(() => {
      activeIds.forEach((id) => updateObject(id, { groupId: undefined }));
    });
  };

  // Layering
  const handleBringToFront = () => {
    if (!doc || activeIds.length === 0) return;
    const allZ = Array.from(canvasObjects.values()).map((o) => o.zIndex || 0);
    const maxZ = Math.max(...allZ, 0);
    doc.transact(() => {
      activeIds.forEach((id, idx) => updateObject(id, { zIndex: maxZ + idx + 1 }));
    });
  };

  const handleSendToBack = () => {
    if (!doc || activeIds.length === 0) return;
    const allZ = Array.from(canvasObjects.values()).map((o) => o.zIndex || 0);
    const minZ = Math.min(...allZ, 0);
    doc.transact(() => {
      activeIds.forEach((id, idx) => updateObject(id, { zIndex: minZ - idx - 1 }));
    });
  };

  // Delete Selection Action
  const handleDeleteSelection = () => {
    if (!doc || activeIds.length === 0) return;
    doc.transact(() => {
      activeIds.forEach((id) => deleteObject(id));
    });
    onDeselect();
  };

  // Trigger Text Edit Modal
  const handleTriggerEdit = () => {
    if (firstObj) {
      const event = new CustomEvent('boundless-trigger-text-edit', { detail: { id: firstObj.id } });
      window.dispatchEvent(event);
    }
  };

  // 100+ Object Benchmark Generator
  const handleSpawn100Objects = () => {
    const shapes: ('rect' | 'circle' | 'star' | 'triangle')[] = ['rect', 'circle', 'star', 'triangle'];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const centerX = (screenWidth / 2 - stageX) / zoom - 75;
    const centerY = (screenHeight / 2 - stageY) / zoom - 50;

    for (let i = 0; i < 100; i++) {
      const offsetX = (Math.random() - 0.5) * 3000;
      const offsetY = (Math.random() - 0.5) * 3000;
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const newShape: ShapeObject = {
        id: `bench_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        type: 'shape',
        shapeType,
        x: centerX + offsetX,
        y: centerY + offsetY,
        width: 60 + Math.random() * 80,
        height: 60 + Math.random() * 80,
        rotation: Math.random() * 360,
        zIndex: canvasObjects.size + i + 1,
        fill: color,
        stroke: '#ffffff',
        strokeWidth: 1,
        createdBy: 'Benchmark',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addObject(newShape);
    }
  };

  return (
    <div
      className="glass-panel animate-fade-in left-sidebar-dock"
      onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: position ? position.y : 88,
        right: position ? undefined : 16,
        left: position ? position.x : undefined,
        width: 280,
        maxHeight: 'calc(100dvh - 120px)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 9999,
        borderRadius: 14,
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--bg-panel-border)',
        boxShadow: '0 12px 32px var(--shadow-color)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Draggable Header Handle Bar */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e); }}
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
        title="Click and drag to move Left Inspector Sidebar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GripHorizontal size={16} color="var(--text-muted)" />
          <Sliders size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
            {firstObj
              ? isMultiple
                ? `${targetObjs.length} Items Selected`
                : `${firstObj.type.toUpperCase()} Properties`
              : 'Advanced Tools'}
          </span>
        </div>
        {firstObj && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeselect();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeselect();
            }}
            className="tool-btn"
            style={{ width: 24, height: 24 }}
            title="Deselect All"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* If No Object Selected — Show Advanced Workspace Tools */}
      {!firstObj && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workspace Inspector</span>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Select any shape, text node, or sticky note on the canvas to inspect and edit its properties.
          </p>

          <div style={{ paddingTop: 6, borderTop: '1px solid var(--bg-panel-border)' }}>
            <button
              onClick={handleSpawn100Objects}
              className="btn-primary"
              style={{ width: '100%', height: 34, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              title="Stress Test Canvas with 100 Random Objects"
            >
              <Zap size={14} />
              <span>Spawn 100 Test Objects</span>
            </button>
          </div>
        </div>
      )}

      {/* If Object Selected — Show Active Inspector Tools */}
      {firstObj && (
        <>
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
                <button
                  onClick={handleGroup}
                  className="btn-primary"
                  style={{ flex: 1, height: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <GroupIcon size={14} />
                  <span>Group Objects</span>
                </button>
              )}
              {firstGroupId && (
                <button
                  onClick={handleUngroup}
                  className="tool-btn"
                  style={{ flex: 1, height: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#f59e0b', border: '1px solid var(--bg-panel-border)' }}
                >
                  <Ungroup size={14} />
                  <span>Ungroup Objects</span>
                </button>
              )}
            </div>
          )}

          {/* Typography Controls */}
          {(firstObj.type === 'text' || firstObj.type === 'sticky') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Typography</span>
              
              {/* Font Size & Bold/Italic/Underline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min={12}
                  max={120}
                  value={fontSizeInput}
                  onChange={(e) => {
                    setFontSizeInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 6 && val <= 200) {
                      applyPatch({ fontSize: val });
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(fontSizeInput, 10);
                    if (isNaN(val) || val < 12) {
                      setFontSizeInput('12');
                      applyPatch({ fontSize: 12 });
                    } else if (val > 120) {
                      setFontSizeInput('120');
                      applyPatch({ fontSize: 120 });
                    }
                  }}
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

          {/* Stroke Width Slider for Shapes */}
          {firstObj.type === 'shape' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Stroke Width: {(firstObj as ShapeObject).strokeWidth || 2}px
              </span>
              <input
                type="range"
                min={1}
                max={16}
                value={(firstObj as ShapeObject).strokeWidth || 2}
                onChange={(e) => applyPatch({ strokeWidth: Number(e.target.value) || 2 })}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          )}

          {/* Color Palette Swatches */}
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

          {/* Delete Selection Action */}
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
        </>
      )}
    </div>
  );
};
