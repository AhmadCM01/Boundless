import React, { useState, useEffect, useRef } from 'react';
import { Rect, Text, Group } from 'react-konva';
import { AudioObject } from '../../../shared/types';
import { Play, Pause } from 'lucide-react';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API GainNode on first user play action
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

  // Spatial Distance Volume Falloff Hook
  useEffect(() => {
    // Calculate viewport center in canvas world coordinates
    const viewportCenterX = (window.innerWidth / 2 - stageX) / zoom;
    const viewportCenterY = (window.innerHeight / 2 - stageY) / zoom;

    const audioCenterX = object.x + (object.width || 250) / 2;
    const audioCenterY = object.y + (object.height || 110) / 2;

    const dx = viewportCenterX - audioCenterX;
    const dy = viewportCenterY - audioCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Volume Curve: 1.0 within 300px, smooth falloff to 0.0 at 1500px
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
      // Smooth exponential/linear gain transition over 100ms
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.1);
    } else if (audioRef.current) {
      audioRef.current.volume = targetGain;
    }
  }, [stageX, stageY, zoom, object.x, object.y, object.width, object.height]);

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
          fill="var(--bg-panel)"
          stroke={isSelected ? 'var(--accent-primary)' : 'var(--bg-panel-border)'}
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
          fill="var(--text-heading)"
        />

        <Text
          x={16}
          y={36}
          text={`${Math.round(object.duration || 0)}s duration • Proximity Audio`}
          fontSize={11}
          fontFamily="Inter"
          fill="var(--text-muted)"
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
      </div>
    </>
  );
};
