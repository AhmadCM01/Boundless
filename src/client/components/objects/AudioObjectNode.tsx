import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Rect, Text, Group } from 'react-konva';
import { AudioObject } from '../../../shared/types';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API GainNode on play
  const handlePlay = () => {
    if (audioRef.current) {
      if (!audioCtxRef.current) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const source = ctx.createMediaElementSource(audioRef.current);
          const gain = ctx.createGain();
          source.connect(gain);
          gain.connect(ctx.destination);
          audioCtxRef.current = ctx;
          gainNodeRef.current = gain;
        } catch (e) {
          console.warn('WebAudio spatial setup fallback:', e);
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }
  };

  // Spatial Distance Volume Falloff
  useEffect(() => {
    const viewportCenterX = (window.innerWidth / 2 - stageX) / zoom;
    const viewportCenterY = (window.innerHeight / 2 - stageY) / zoom;

    const audioCenterX = object.x + (object.width || 250) / 2;
    const audioCenterY = object.y + (object.height || 110) / 2;

    const dx = viewportCenterX - audioCenterX;
    const dy = viewportCenterY - audioCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let targetGain = 1.0;
    if (distance <= 300) {
      targetGain = 1.0;
    } else if (distance >= 1500) {
      targetGain = 0.0;
    } else {
      targetGain = 1.0 - (distance - 300) / 1200;
    }

    targetGain = Math.max(0, Math.min(1, targetGain));

    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.1);
    } else if (audioRef.current) {
      audioRef.current.volume = targetGain;
    }
  }, [stageX, stageY, zoom, object.x, object.y, object.width, object.height]);

  // Convert world canvas coordinates to screen pixels for HTML player overlay
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
        {/* Audio Card Background Rect */}
        <Rect
          width={object.width || 250}
          height={object.height || 110}
          fill="#1e293b"
          stroke={isSelected ? '#3b82f6' : '#334155'}
          strokeWidth={2}
          cornerRadius={14}
          shadowColor="rgba(0,0,0,0.5)"
          shadowBlur={14}
          shadowOffsetY={6}
        />

        <Text
          x={16}
          y={16}
          text={object.title || 'Voice Note'}
          fontSize={14}
          fontStyle="bold"
          fontFamily="Inter"
          fill="#ffffff"
        />

        <Text
          x={16}
          y={36}
          text={`${Math.round(object.duration || 0)}s • Proximity Audio`}
          fontSize={11}
          fontFamily="Inter"
          fill="#94a3b8"
        />
      </Group>

      {/* HTML Audio Controls Overlay via Portal to document.body */}
      {ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            left: screenX + 16 * zoom,
            top: screenY + 54 * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            pointerEvents: 'auto',
            zIndex: 1000,
          }}
        >
          <audio
            ref={audioRef}
            src={object.audioUrl}
            controls
            onPlay={handlePlay}
            style={{
              height: 36,
              width: 210,
              borderRadius: 8,
              filter: 'invert(0.85) hue-rotate(180deg)',
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
};
