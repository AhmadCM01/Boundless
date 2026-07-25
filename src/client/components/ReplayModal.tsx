import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { useRoom } from '../context/RoomContext';
import { Play, Pause, RotateCcw, X, History } from 'lucide-react';
import { CanvasObject } from '../../shared/types';

interface Props {
  onClose: () => void;
}

interface DeltaRecord {
  timestamp: number;
  deltaBase64: string;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const ReplayModal: React.FC<Props> = ({ onClose }) => {
  const { roomId, canvasObjects } = useRoom();
  const [updates, setUpdates] = useState<DeltaRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [replayObjects, setReplayObjects] = useState<CanvasObject[]>([]);
  const timerRef = useRef<any>(null);

  // Fetch binary Y.Doc update deltas from server
  useEffect(() => {
    fetch(`/api/rooms/${roomId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.updates && data.updates.length > 0) {
          console.log(`📜 Loaded ${data.updates.length} history deltas for room: ${roomId}`);
          setUpdates(data.updates);
          setCurrentIndex(data.updates.length - 1);
        } else {
          setReplayObjects(Array.from(canvasObjects.values()));
        }
      })
      .catch((err) => {
        console.error('Failed to load session history:', err);
        setReplayObjects(Array.from(canvasObjects.values()));
      });
  }, [roomId, canvasObjects]);

  // Apply Y.Doc binary deltas sequentially up to currentIndex
  useEffect(() => {
    if (updates.length === 0) return;

    const scratchDoc = new Y.Doc();
    const scratchMap = scratchDoc.getMap<CanvasObject>('objects');

    for (let i = 0; i <= currentIndex && i < updates.length; i++) {
      try {
        const bytes = base64ToUint8Array(updates[i].deltaBase64);
        Y.applyUpdate(scratchDoc, bytes);
      } catch (e) {
        console.error('Failed to apply update delta index:', i, e);
      }
    }

    const objs: CanvasObject[] = [];
    scratchMap.forEach((val) => objs.push(val));
    setReplayObjects(objs);

    scratchDoc.destroy();
  }, [currentIndex, updates]);

  // Playback Animation Interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= updates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 400 / speed);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, updates.length]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-dark)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
      }}
    >
      {/* Full-Width Header */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 900,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <History size={22} color="#3b82f6" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>
            Full Canvas Time Travel Replay ({replayObjects.length} objects)
          </h3>
        </div>
        <button onClick={onClose} className="btn-primary" style={{ padding: '8px 16px', gap: 6 }}>
          <X size={18} />
          <span>Exit Replay</span>
        </button>
      </div>

      {/* Full Canvas Viewport */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {replayObjects.map((obj) => {
          const color = (obj as any).fill || (obj as any).color || '#6366f1';
          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left: `calc(50vw + ${(obj.x || 0)}px)`,
                top: `calc(50vh + ${(obj.y || 0)}px)`,
                width: obj.width || 120,
                height: obj.height || 100,
                borderRadius: obj.type === 'shape' && (obj as any).shapeType === 'circle' ? '50%' : 8,
                backgroundColor: color,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {obj.type === 'sticky' ? (obj as any).text : obj.type === 'text' ? (obj as any).text : obj.type}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Timeline Scrubber */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 900,
          padding: '16px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 100,
        }}
      >
        {/* Scrubber Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 80, fontWeight: 700 }}>
            {currentIndex + 1} / {updates.length || 1}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, updates.length - 1)}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value, 10));
            }}
            style={{ flex: 1, cursor: 'pointer', height: 8 }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(0);
              }}
              className="tool-btn"
              title="Reset to start"
              style={{ padding: '8px 14px' }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span>{isPlaying ? 'Pause Replay' : 'Play Replay'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd as any)}
                className={`tool-btn ${speed === spd ? 'active' : ''}`}
                style={{ width: 42, height: 36, fontSize: 13, fontWeight: 700 }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
