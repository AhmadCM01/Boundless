import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Star, Line, Arrow, Group, Transformer } from 'react-konva';
import { ShapeObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: ShapeObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ShapeObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const ShapeObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd: onDragEndProp,
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const commonProps = {
    ref: shapeRef,
    fill: object.fill || '#6366f1',
    stroke: object.stroke || object.fill || '#818cf8',
    strokeWidth: object.strokeWidth || 2,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 10,
    shadowOffsetY: 4,
    perfectDrawEnabled: false, // Ensures crisp line rendering across zoom levels
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (node) {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(20, object.width * scaleX),
        height: Math.max(20, object.height * scaleY),
        rotation: node.rotation(),
      });
    }
  };

  const renderShape = () => {
    switch (object.shapeType) {
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={object.width / 2}
            offsetX={-object.width / 2}
            offsetY={-object.height / 2}
          />
        );
      case 'star':
        return (
          <Star
            {...commonProps}
            numPoints={5}
            innerRadius={object.width / 4}
            outerRadius={object.width / 2}
            offsetX={-object.width / 2}
            offsetY={-object.height / 2}
          />
        );
      case 'triangle':
        return (
          <Line
            {...commonProps}
            points={[object.width / 2, 0, 0, object.height, object.width, object.height]}
            closed
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={[0, 0, object.width, object.height]}
            strokeWidth={object.strokeWidth || 4}
          />
        );
      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={[0, 0, object.width, object.height]}
            pointerLength={14}
            pointerWidth={14}
            strokeWidth={object.strokeWidth || 4}
          />
        );
      case 'rect':
      default:
        return (
          <Rect
            {...commonProps}
            width={object.width}
            height={object.height}
            cornerRadius={8}
          />
        );
    }
  };

  return (
    <>
      <Group
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
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
        {renderShape()}
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
