import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { useRoom } from '../context/RoomContext';
import { Play, Pause, RotateCcw, FastForward, X, History } from 'lucide-react';
import { CanvasObject } from '../../shared/types';

interface Props {
  onClose: () => void;
}

interface DeltaRecord {
  timestamp: number;
  deltaBase64: string;
}

export const ReplayModal: React.FC<Props> = ({ onClose }) => {
  const { roomId } = useRoom();
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
          setUpdates(data.updates);
          setCurrentIndex(data.updates.length - 1);
        }
      })
      .catch((err) => console.error('Failed to load session history:', err));
  }, [roomId]);

  // Apply Y.Doc binary deltas sequentially up to currentIndex
  useEffect(() => {
    if (updates.length === 0) return;

    const scratchDoc = new Y.Doc();
    const scratchMap = scratchDoc.getMap<CanvasObject>('objects');

    for (let i = 0; i <= currentIndex && i < updates.length; i++) {
      try {
        const binaryString = atob(updates[i].deltaBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        Y.applyUpdate(scratchDoc, bytes);
      } catch (e) {
        console.error('Failed to apply update delta:', e);
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
      }, 500 / speed);
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
          maxWidth: 600,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <History size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 16, color: 'var(--text-heading)' }}>Session Time Travel Replay</h3>
        </div>
        <button onClick={onClose} className="tool-btn" style={{ width: 32, height: 32 }}>
          <X size={18} />
        </button>
      </div>

      {/* Render Scratch Canvas State */}
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          height: 380,
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
            {updates.length === 0 ? 'No session history recorded yet. Make edits on canvas!' : 'Scrubbing history...'}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {replayObjects.map((obj) => (
              <div
                key={obj.id}
                style={{
                  position: 'absolute',
                  left: Math.max(20, Math.min(700, obj.x + 300)),
                  top: Math.max(20, Math.min(300, obj.y + 150)),
                  width: obj.width || 80,
                  height: obj.height || 80,
                  borderRadius: obj.type === 'shape' && (obj as any).shapeType === 'circle' ? '50%' : 8,
                  backgroundColor: (obj as any).fill || (obj as any).color || '#6366f1',
                  color: '#fff',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {obj.type === 'sticky' ? (obj as any).text : obj.type === 'text' ? (obj as any).text : obj.type}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrubber Controls */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 600,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Scrubber Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd as any)}
                className={`tool-btn ${speed === spd ? 'active' : ''}`}
                style={{ width: 36, height: 32, fontSize: 12, fontWeight: 600 }}
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
