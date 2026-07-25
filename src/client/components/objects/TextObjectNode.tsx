import React, { useState, useRef, useEffect } from 'react';
import { Text, Group, Transformer } from 'react-konva';
import { TextObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: TextObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TextObject>) => void;
}

export const TextObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(object.text);
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    setTextValue(object.text);
  }, [object.text]);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTriggerEdit = (e: Konva.KonvaEventObject<any>) => {
    e.cancelBubble = true;
    console.log('✏️ Double click detected on Text object:', object.id);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (textValue.trim() !== object.text) {
      onChange({ text: textValue.trim() || 'Text' });
    }
  };

  return (
    <>
      <Group
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable={!isEditing}
        onClick={(e) => {
          if (e.evt.detail === 2) {
            handleTriggerEdit(e);
          } else {
            onSelect();
          }
        }}
        onTap={(e) => {
          if (e.evt.detail === 2) {
            handleTriggerEdit(e);
          } else {
            onSelect();
          }
        }}
        onDblClick={handleTriggerEdit}
        onDblTap={handleTriggerEdit}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
      >
        <Text
          ref={textRef}
          text={object.text}
          fontSize={object.fontSize || 20}
          fontFamily={object.fontFamily || 'Inter'}
          fill={object.fill || '#e5e7eb'}
          width={object.width}
          wrap="word"
          opacity={isEditing ? 0.3 : 1}
          onTransformEnd={() => {
            const node = textRef.current;
            if (node) {
              const scaleX = node.scaleX();
              node.scaleX(1);
              node.scaleY(1);
              onChange({
                x: node.x(),
                y: node.y(),
                width: Math.max(50, node.width() * scaleX),
                rotation: node.rotation(),
              });
            }
          }}
        />
      </Group>

      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          shouldOverdrawWholeArea={true}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50) return oldBox;
            return newBox;
          }}
        />
      )}

      {/* HTML Text Editing Dialog */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={handleSave}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: 360, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>Edit Text Block</h4>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              rows={4}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--bg-input)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-main)',
                fontSize: 15,
                fontFamily: 'Inter',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="tool-btn"
                style={{ padding: '6px 12px', width: 'auto', height: 'auto', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: 13 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
