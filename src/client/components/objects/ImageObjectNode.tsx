import React, { useState, useEffect, useRef } from 'react';
import { Image as KonvaImage, Group, Transformer } from 'react-konva';
import { ImageObject } from '../../../shared/types';
import Konva from 'konva';

interface Props {
  object: ImageObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageObject>) => void;
}

export const ImageObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
}) => {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
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
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
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
        <KonvaImage
          ref={imageRef}
          image={imageElement || undefined}
          width={object.width}
          height={object.height}
          cornerRadius={8}
          shadowColor="rgba(0, 0, 0, 0.4)"
          shadowBlur={12}
          shadowOffsetY={4}
          onTransformEnd={() => {
            const node = imageRef.current;
            if (node) {
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              onChange({
                x: node.x(),
                y: node.y(),
                width: Math.max(40, node.width() * scaleX),
                height: Math.max(40, node.height() * scaleY),
                rotation: node.rotation(),
              });
            }
          }}
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 40 || newBox.height < 40) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
