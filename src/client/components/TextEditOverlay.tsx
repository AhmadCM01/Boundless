import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../context/RoomContext';

interface Props {
  editingId: string | null;
  onClose: () => void;
  stageX?: number;
  stageY?: number;
  zoom?: number;
}

export const TextEditOverlay: React.FC<Props> = ({
  editingId,
  onClose,
  stageX = 0,
  stageY = 0,
  zoom = 1,
}) => {
  const { canvasObjects, updateObject } = useRoom();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeObj = editingId ? canvasObjects.get(editingId) : null;
  const [textValue, setTextValue] = useState<string>('');

  useEffect(() => {
    if (activeObj) {
      const objText = (activeObj as any).text;
      setTextValue(typeof objText === 'string' ? objText : '');
    }
  }, [editingId, activeObj]);

  /**
   * ─── Double-Click Mount-Time Focus Guard ──────────────────────────────────────
   * DO NOT REMOVE THIS 50ms TIMEOUT: When a user double-clicks a text object on stage,
   * the second click event finishes bubbling through Konva after TextEditOverlay mounts.
   * Without this 50ms delay, the browser's immediate click-focus handling immediately steals
   * focus away from the overlay textarea, causing text editing to instantly close.
   */
  useEffect(() => {
    if (editingId && textareaRef.current) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editingId]);

  if (!editingId || !activeObj) return null;

  const safeZoom = typeof zoom === 'number' && !isNaN(zoom) ? zoom : 1;
  const safeStageX = typeof stageX === 'number' && !isNaN(stageX) ? stageX : 0;
  const safeStageY = typeof stageY === 'number' && !isNaN(stageY) ? stageY : 0;

  const objX = typeof activeObj.x === 'number' ? activeObj.x : 0;
  const objY = typeof activeObj.y === 'number' ? activeObj.y : 0;

  const titleText = activeObj.type === 'sticky' ? 'Edit Sticky Note' : 'Edit Text Block';
  const defaultText = activeObj.type === 'sticky' ? 'Sticky note...' : 'Text';

  const handleSave = () => {
    const trimmed = typeof textValue === 'string' ? textValue.trim() : '';
    const existing = typeof (activeObj as any).text === 'string' ? (activeObj as any).text : '';
    if (trimmed !== existing) {
      updateObject(editingId, { text: trimmed || defaultText });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
      onClick={handleSave}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{ width: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{titleText}</h4>
        <textarea
          ref={textareaRef}
          value={textValue}
          onChange={(e) => {
            e.stopPropagation();
            setTextValue(e.target.value);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          rows={5}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--input-border)',
            color: 'var(--text-main)',
            fontSize: 16,
            fontFamily: 'Inter',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="tool-btn"
            style={{ padding: '8px 16px', width: 'auto', height: 'auto', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: 14 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
