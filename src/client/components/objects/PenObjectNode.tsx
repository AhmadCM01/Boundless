import React, { useRef, useEffect } from 'react';
import { Line, Group, Transformer } from 'react-konva';
import { PenObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: PenObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<PenObject>) => void;
}

export const PenObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
}) => {
  const lineRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && lineRef.current) {
      trRef.current.nodes([lineRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        x={object.x}
        y={object.y}
        rotation={object.rotation || 0}
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
        <Line
          ref={lineRef}
          points={object.points || []}
          stroke={object.stroke || '#6366f1'}
          strokeWidth={object.strokeWidth || 3}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(12, (object.strokeWidth || 3) * 2)}
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
