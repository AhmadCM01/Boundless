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

// Convert base64 string safely to Uint8Array without Latin1 corruption
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

  // Fetch binary Y.Doc update deltas from Fastify server history endpoint
  useEffect(() => {
    fetch(`/api/rooms/${roomId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.updates && data.updates.length > 0) {
          console.log(`📜 Loaded ${data.updates.length} history deltas for room: ${roomId}`);
          setUpdates(data.updates);
          setCurrentIndex(data.updates.length - 1);
        } else {
          console.warn('No server history deltas recorded yet. Fallback to current live objects.');
          const currentList = Array.from(canvasObjects.values());
          setReplayObjects(currentList);
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
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        zIndex: 2500,
      }}
    >
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 640,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <History size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>
            Session Time Travel Replay ({replayObjects.length} objects)
          </h3>
        </div>
        <button onClick={onClose} className="tool-btn" style={{ width: 32, height: 32 }}>
          <X size={18} />
        </button>
      </div>

      {/* Render Scratch Canvas State Viewport */}
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          height: 400,
          borderRadius: 20,
          background: 'var(--bg-dark)',
          border: '1px solid var(--bg-panel-border)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {replayObjects.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {updates.length === 0 ? 'No edits recorded in this session yet.' : 'Scrubbing history...'}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {replayObjects.map((obj) => {
              const posX = Math.max(30, Math.min(720, (obj.x || 0) * 0.45 + 360));
              const posY = Math.max(30, Math.min(320, (obj.y || 0) * 0.45 + 180));
              const width = Math.max(40, (obj.width || 80) * 0.45);
              const height = Math.max(40, (obj.height || 80) * 0.45);
              const color = (obj as any).fill || (obj as any).color || '#6366f1';

              return (
                <div
                  key={obj.id}
                  style={{
                    position: 'absolute',
                    left: posX,
                    top: posY,
                    width,
                    height,
                    borderRadius: obj.type === 'shape' && (obj as any).shapeType === 'circle' ? '50%' : 8,
                    backgroundColor: color,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'all 0.15s ease',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {obj.type === 'sticky' ? (obj as any).text : obj.type === 'text' ? (obj as any).text : obj.type}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrubber Controls Bar */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 640,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Scrubber Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 70, fontWeight: 600 }}>
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
            style={{ flex: 1, cursor: 'pointer' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(0);
              }}
              className="tool-btn"
              title="Reset to start"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd as any)}
                className={`tool-btn ${speed === spd ? 'active' : ''}`}
                style={{ width: 38, height: 32, fontSize: 12, fontWeight: 600 }}
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
