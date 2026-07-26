import React, { useRef, useEffect } from 'react';
import { Rect, Text, Group, Transformer } from 'react-konva';
import { StickyObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: StickyObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<StickyObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const StickyObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd: onDragEndProp,
}) => {
  const groupRef = useRef<Konva.Group>(null);
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

  const handleTransformEnd = () => {
    const group = groupRef.current;
    if (group) {
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();
      group.scaleX(1);
      group.scaleY(1);
      onChange({
        x: Math.round(group.x()),
        y: Math.round(group.y()),
        width: Math.max(100, Math.round((object.width || 180) * scaleX)),
        height: Math.max(100, Math.round((object.height || 180) * scaleY)),
        rotation: Math.round(group.rotation()),
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
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
          if (onDragEndProp) onDragEndProp(e);
        }}
        onTransformEnd={handleTransformEnd}
      >
        {/* Sticky Background Card */}
        <Rect
          width={object?.width ?? 180}
          height={object?.height ?? 180}
          fill={object?.color || '#fef08a'}
          cornerRadius={6}
          shadowColor="rgba(0, 0, 0, 0.4)"
          shadowBlur={12}
          shadowOffsetY={6}
        />

        {/* Note Text */}
        <Text
          x={14}
          y={14}
          width={(object?.width || 180) - 28}
          height={(object?.height || 180) - 40}
          text={object?.text || 'Sticky note...'}
          fontSize={15}
          fontFamily="Inter"
          fill="#1e293b"
          wrap="word"
        />

        {/* Author Tag Footer */}
        <Text
          x={14}
          y={(object?.height ?? 180) - 24}
          width={(object?.width || 180) - 28}
          text={`— ${object?.author || 'Guest'}`}
          fontSize={11}
          fontStyle="bold"
          fontFamily="Inter"
          fill="#475569"
          align="right"
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          onTransformEnd={handleTransformEnd}
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect();
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
    </>
  );
};
