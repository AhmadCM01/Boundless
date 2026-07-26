import React, { useRef, useEffect } from 'react';
import { Text, Group, Transformer } from 'react-konva';
import { TextObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: TextObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TextObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const TextObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd: onDragEndProp,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTriggerEdit = () => {
    const event = new CustomEvent('boundless-trigger-text-edit', { detail: { id: object.id } });
    window.dispatchEvent(event);
  };

  // Synchronously reset node scale to 1.0 AFTER React renders updated Yjs width/x/y/rotation
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scaleX(1);
      groupRef.current.scaleY(1);
    }
  }, [object.width, object.height, object.x, object.y, object.rotation, object.fontSize]);

  const handleTransformEnd = () => {
    const group = groupRef.current;
    if (group) {
      const newX = Math.round(group.x());
      const newY = Math.round(group.y());
      const newRotation = Math.round(group.rotation());
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();

      const baseWidth = object?.width || textRef.current?.width() || 200;
      const newWidth = Math.max(60, Math.round(baseWidth * scaleX));

      // If scaleY is modified (corner scaling), adjust font size proportionally
      const isCornerScale = Math.abs(scaleY - 1) > 0.05;
      const currentFontSize = object?.fontSize || 20;
      const newFontSize = isCornerScale ? Math.max(12, Math.round(currentFontSize * scaleY)) : currentFontSize;

      onChange({
        x: newX,
        y: newY,
        width: newWidth,
        fontSize: newFontSize,
        rotation: newRotation,
      });
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={object?.x ?? 0}
        y={object?.y ?? 0}
        rotation={object?.rotation ?? 0}
        draggable={true}
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
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          if (onDragEndProp) onDragEndProp(e);
        }}
        onTransformEnd={handleTransformEnd}
      >
        <Text
          ref={textRef}
          text={
            object?.textTransform === 'uppercase'
              ? (object?.text || '').toUpperCase()
              : object?.textTransform === 'lowercase'
              ? (object?.text || '').toLowerCase()
              : object?.text || ''
          }
          fontSize={object?.fontSize || 20}
          fontFamily={object?.fontFamily || 'Inter'}
          fontStyle={`${object?.fontWeight || 'normal'} ${object?.fontStyle || 'normal'}`.trim()}
          fill={object?.fill || '#ef4444'}
          align={(object?.textAlign as any) || 'left'}
          textDecoration={object?.textDecoration || ''}
          width={object?.width || undefined}
          wrap="word"
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          onTransformEnd={handleTransformEnd}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
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
            if (newBox.width < 50 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
