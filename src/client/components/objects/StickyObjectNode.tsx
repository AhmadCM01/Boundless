import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Rect, Text, Group, Transformer } from 'react-konva';
import { StickyObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: StickyObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<StickyObject>) => void;
}

export const StickyObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(object.text);
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    setTextValue(object.text);
  }, [object.text]);

  // Listen for custom trigger edit event from property bar or keyboard
  useEffect(() => {
    const handleCustomTrigger = (e: any) => {
      if (e.detail && e.detail.id === object.id) {
        setIsEditing(true);
      }
    };
    window.addEventListener('boundless-trigger-text-edit', handleCustomTrigger);
    return () => window.removeEventListener('boundless-trigger-text-edit', handleCustomTrigger);
  }, [object.id]);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTriggerEdit = () => {
    console.log('✏️ Triggering edit on Sticky Note object:', object.id);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (textValue.trim() !== object.text) {
      onChange({ text: textValue.trim() || 'Sticky note...' });
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable={!isEditing}
        onClick={(e) => {
          e.cancelBubble = true;
          if (isSelected) {
            handleTriggerEdit();
          } else {
            onSelect();
          }
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          if (isSelected) {
            handleTriggerEdit();
          } else {
            onSelect();
          }
        }}
        onDblClick={(e) => {
          e.cancelBubble = true;
          handleTriggerEdit();
        }}
        onDblTap={(e) => {
          e.cancelBubble = true;
          handleTriggerEdit();
        }}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
      >
        {/* Sticky Background Card */}
        <Rect
          width={object.width}
          height={object.height}
          fill={object.color || '#fef08a'}
          cornerRadius={6}
          shadowColor="rgba(0, 0, 0, 0.4)"
          shadowBlur={12}
          shadowOffsetY={6}
        />

        {/* Note Text */}
        <Text
          x={14}
          y={14}
          width={object.width - 28}
          height={object.height - 40}
          text={object.text || 'Sticky note...'}
          fontSize={15}
          fontFamily="Inter"
          fill="#1e293b"
          wrap="word"
        />

        {/* Author Tag Footer */}
        <Text
          x={14}
          y={object.height - 24}
          width={object.width - 28}
          text={`— ${object.author || 'Guest'}`}
          fontSize={11}
          fontStyle="bold"
          fontFamily="Inter"
          fill="#475569"
          align="right"
        />
      </Group>

      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          onClick={(e) => {
            e.cancelBubble = true;
            handleTriggerEdit();
          }}
          onDblClick={(e) => {
            e.cancelBubble = true;
            handleTriggerEdit();
          }}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 100 || newBox.height < 100) return oldBox;
            return newBox;
          }}
        />
      )}

      {/* HTML Sticky Note Editing Modal Portal */}
      {isEditing && ReactDOM.createPortal(
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
            style={{ width: 380, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Edit Sticky Note</h4>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              rows={5}
              autoFocus
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
                onClick={() => setIsEditing(false)}
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
        </div>,
        document.body
      )}
    </>
  );
};
