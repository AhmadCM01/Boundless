import React, { useState } from 'react';
import { Rect, Text, Group } from 'react-konva';
import { AudioObject } from '../../../shared/types';
import { Play, Pause, Mic, Square } from 'lucide-react';

interface Props {
  object: AudioObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<AudioObject>) => void;
  stageX: number;
  stageY: number;
  zoom: number;
}

export const AudioObjectNode: React.FC<Props> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  stageX,
  stageY,
  zoom,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef] = useState(() => new Audio(object.audioUrl));

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      audioRef.play();
      setIsPlaying(true);
      audioRef.onended = () => setIsPlaying(false);
    }
  };

  // Convert canvas world coordinates to screen pixel position for HTML player overlay
  const screenX = object.x * zoom + stageX;
  const screenY = object.y * zoom + stageY;

  return (
    <>
      <Group
        x={object.x}
        y={object.y}
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
        {/* Audio Card Shape */}
        <Rect
          width={object.width}
          height={object.height}
          fill="#1e1b4b"
          stroke={isSelected ? '#6366f1' : '#312e81'}
          strokeWidth={2}
          cornerRadius={14}
          shadowColor="rgba(0,0,0,0.5)"
          shadowBlur={16}
          shadowOffsetY={6}
        />

        <Text
          x={16}
          y={16}
          text={object.title || 'Audio Recording'}
          fontSize={14}
          fontStyle="bold"
          fontFamily="Inter"
          fill="#f3f4f6"
        />

        <Text
          x={16}
          y={36}
          text={`${Math.round(object.duration || 0)}s duration`}
          fontSize={11}
          fontFamily="Inter"
          fill="#94a3b8"
        />
      </Group>

      {/* HTML Interactive Playback & Audio Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          left: screenX + 16 * zoom,
          top: screenY + 54 * zoom,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          pointerEvents: 'auto',
          zIndex: 50,
        }}
      >
        <audio
          src={object.audioUrl}
          controls
          style={{
            height: 36,
            width: 210,
            borderRadius: 8,
            filter: 'invert(0.9) hue-rotate(180deg)',
          }}
        />
      </div>
    </>
  );
};
