import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  const [textValue, setTextValue] = useState<string>(typeof object.text === 'string' ? object.text : '');
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    setTextValue(typeof object.text === 'string' ? object.text : '');
  }, [object.text]);

  // Edit trigger listener
  useEffect(() => {
    const handleCustomTrigger = (e: any) => {
      if (e.detail?.id === object.id) {
        mountTimeRef.current = Date.now();
        setIsEditing(true);
      }
    };
    window.addEventListener('boundless-trigger-text-edit', handleCustomTrigger);
    return () => window.removeEventListener('boundless-trigger-text-edit', handleCustomTrigger);
  }, [object.id]);

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTriggerEdit = () => {
    mountTimeRef.current = Date.now();
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    const safeValue = typeof textValue === 'string' ? textValue.trim() : '';
    const safeExisting = typeof object.text === 'string' ? object.text : '';
    if (safeValue !== safeExisting) {
      onChange({ text: safeValue || 'Text' });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (Date.now() - mountTimeRef.current < 300) {
      return;
    }
    handleSave();
  };

  return (
    <>
      <Group
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable={!isEditing}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
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
        <Text
          ref={textRef}
          text={object?.text || ''}
          fontSize={object?.fontSize || 20}
          fontFamily={object?.fontFamily || 'Inter'}
          fill={object?.fill || '#e5e7eb'}
          width={object?.width}
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
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect();
          }}
          onDblClick={(e) => {
            e.cancelBubble = true;
            handleTriggerEdit();
          }}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50) return oldBox;
            return newBox;
          }}
        />
      )}

      {/* HTML Text Editing Modal Portal */}
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
          onClick={handleBackdropClick}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Edit Text Block</h4>
            <textarea
              ref={textareaRef}
              value={typeof textValue === 'string' ? textValue : ''}
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
                  setIsEditing(false);
                }
              }}
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
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
