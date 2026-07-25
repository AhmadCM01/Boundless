import React, { useRef, useEffect } from 'react';
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
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        ref={groupRef}
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
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
          fill="#64748b"
          align="right"
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 100 || newBox.height < 100) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
