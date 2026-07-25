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
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textValue !== object.text) {
      onChange({ text: textValue });
    }
  };

  return (
    <>
      <Group
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable={!isEditing}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDoubleClick}
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
          fill={object.fill || '#f3f4f6'}
          width={object.width}
          wrap="word"
          opacity={isEditing ? 0 : 1}
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
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
