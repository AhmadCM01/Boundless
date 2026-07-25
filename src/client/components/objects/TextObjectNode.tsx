import React, { useRef, useEffect } from 'react';
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
        onDragEnd={() => {
          if (groupRef.current) {
            onChange({
              x: groupRef.current.x(),
              y: groupRef.current.y(),
            });
          }
        }}
        onTransformEnd={() => {
          const group = groupRef.current;
          if (group) {
            const scaleX = group.scaleX();
            group.scaleX(1);
            group.scaleY(1);
            const baseWidth = object?.width || textRef.current?.width() || 200;
            const newWidth = Math.max(50, baseWidth * scaleX);
            onChange({
              x: group.x(),
              y: group.y(),
              width: newWidth,
              rotation: group.rotation(),
            });
          }
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
        />
      </Group>

      {isSelected && (
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
    </>
  );
};
