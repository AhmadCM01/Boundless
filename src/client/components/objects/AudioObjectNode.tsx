import React, { useState, useEffect, useRef } from 'react';
import { Rect, Text, Group, Circle, Line, Transformer } from 'react-konva';
import { AudioObject } from '../../../shared/types';
import Konva from 'konva';

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
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 24, 10, 30, 18, 26, 14]);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const groupRef = useRef<Konva.Group | null>(null);
  const animFrameRef = useRef<any>(null);

  const cardW = object.width || 250;
  const cardH = object.height || 100;

  // Initialize or update HTMLAudioElement instance (decoupled from DOM/Konva tree)
  useEffect(() => {
    if (object.audioUrl || object.src) {
      const url = object.audioUrl || object.src;
      const audio = new Audio(url);
      audioInstanceRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };
      audio.onerror = (e) => {
        console.warn('Audio playback error:', e);
        setIsPlaying(false);
      };

      return () => {
        audio.pause();
        audioInstanceRef.current = null;
      };
    }
  }, [object.audioUrl, object.src]);

  // Spatial Proximity Volume Falloff
  useEffect(() => {
    const audio = audioInstanceRef.current;
    if (!audio) return;

    const viewportCenterX = (window.innerWidth / 2 - stageX) / zoom;
    const viewportCenterY = (window.innerHeight / 2 - stageY) / zoom;

    const audioCenterX = object.x + cardW / 2;
    const audioCenterY = object.y + cardH / 2;

    const dx = viewportCenterX - audioCenterX;
    const dy = viewportCenterY - audioCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let targetVolume = 1.0;
    if (distance <= 300) {
      targetVolume = 1.0;
    } else if (distance >= 1500) {
      targetVolume = 0.0;
    } else {
      targetVolume = 1.0 - (distance - 300) / 1200;
    }

    audio.volume = Math.max(0, Math.min(1, targetVolume));
  }, [stageX, stageY, zoom, object.x, object.y, cardW, cardH]);

  // Waveform Bar Animation loop when playing
  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = setInterval(() => {
        setWaveHeights([
          8 + Math.random() * 26,
          14 + Math.random() * 24,
          6 + Math.random() * 18,
          18 + Math.random() * 28,
          10 + Math.random() * 22,
          16 + Math.random() * 24,
          8 + Math.random() * 20,
        ]);
      }, 100);
    } else {
      clearInterval(animFrameRef.current);
      setWaveHeights([12, 24, 10, 30, 18, 26, 14]);
    }
    return () => clearInterval(animFrameRef.current);
  }, [isPlaying]);

  // Attach Transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const togglePlayback = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();

    const audio = audioInstanceRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Play error:', err);
        setIsPlaying(false);
      });
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
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
        {/* Card Outer Background */}
        <Rect
          width={cardW}
          height={cardH}
          fill="#1e293b"
          stroke={isSelected ? '#3b82f6' : '#334155'}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={14}
          shadowColor="rgba(0, 0, 0, 0.4)"
          shadowBlur={12}
          shadowOffsetY={6}
        />

        {/* Play / Pause Interactive Button Group */}
        <Group x={34} y={cardH / 2} onClick={togglePlayback} onTap={togglePlayback}>
          <Circle
            radius={20}
            fill={isPlaying ? '#3b82f6' : '#334155'}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={6}
          />
          {/* Play/Pause Icon Text */}
          <Text
            x={isPlaying ? -5 : -4}
            y={-7}
            text={isPlaying ? '❚❚' : '▶'}
            fontSize={12}
            fill="#ffffff"
            align="center"
          />
        </Group>

        {/* Title */}
        <Text
          x={68}
          y={18}
          text={object.title || 'Voice Note'}
          fontSize={14}
          fontStyle="bold"
          fontFamily="Inter"
          fill="#ffffff"
          width={cardW - 80}
          ellipsis
        />

        {/* Subtitle / Metadata */}
        <Text
          x={68}
          y={36}
          text={`${Math.round(object.duration || 0)}s • Voice Recording`}
          fontSize={11}
          fontFamily="Inter"
          fill="#94a3b8"
        />

        {/* Animated Waveform Visualizer Bars (Konva Native Lines/Rects) */}
        {waveHeights.map((h, idx) => (
          <Rect
            key={`wave_${idx}`}
            x={68 + idx * 14}
            y={cardH - 18 - h}
            width={6}
            height={h}
            fill={isPlaying ? '#3b82f6' : '#475569'}
            cornerRadius={3}
          />
        ))}
      </Group>

      {/* Konva Transformer for resizing */}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 180 || newBox.height < 80) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
