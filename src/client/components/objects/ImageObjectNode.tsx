import React, { useState, useEffect, useRef } from 'react';
import { Image as KonvaImage, Group, Transformer } from 'react-konva';
import { ImageObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: ImageObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const ImageObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd: onDragEndProp,
}) => {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const groupRef = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = object.src;
    img.onload = () => {
      setImageElement(img);
    };
  }, [object.src]);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    const group = groupRef.current;
    if (group) {
      const newX = Math.round(group.x());
      const newY = Math.round(group.y());
      const newRotation = Math.round(group.rotation());
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();

      group.scaleX(1);
      group.scaleY(1);

      onChange({
        x: newX,
        y: newY,
        width: Math.max(40, Math.round((object.width || 100) * scaleX)),
        height: Math.max(40, Math.round((object.height || 100) * scaleY)),
        rotation: newRotation,
      });
    }
  };

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
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          if (onDragEndProp) onDragEndProp(e);
        }}
        onTransformEnd={handleTransformEnd}
      >
        <KonvaImage
          ref={imageRef}
          image={imageElement || undefined}
          width={object.width}
          height={object.height}
          cornerRadius={8}
          shadowColor="rgba(0, 0, 0, 0.4)"
          shadowBlur={12}
          shadowOffsetY={4}
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio
          rotateEnabled={true}
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 40 || newBox.height < 40) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
