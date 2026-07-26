import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { useRoom } from '../context/RoomContext';
import { Play, Pause, RotateCcw, X, History, User, Sparkles } from 'lucide-react';
import { CanvasObject, TextObject, ShapeObject, StickyObject, ImageObject } from '../../shared/types';

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
    if (!updates || updates.length === 0) return;

    // Instantiate fresh Y.Doc instance for scratch replay
    const scratchDoc = new Y.Doc();
    const scratchMap = scratchDoc.getMap<CanvasObject>('objects');

    try {
      if (updates[0]?.deltaBase64) {
        const baseBytes = base64ToUint8Array(updates[0].deltaBase64);
        Y.applyUpdate(scratchDoc, baseBytes);
      }

      for (let i = 1; i <= currentIndex && i < updates.length; i++) {
        if (updates[i]?.deltaBase64) {
          const bytes = base64ToUint8Array(updates[i].deltaBase64);
          Y.applyUpdate(scratchDoc, bytes);
        }
      }

      const objs: CanvasObject[] = [];
      scratchMap.forEach((val) => {
        if (val && typeof val === 'object' && val.id) {
          objs.push(val);
        }
      });
      setReplayObjects(objs);
    } catch (e) {
      console.error('Failed to reconstruct scratchDoc replay state:', e);
    } finally {
      scratchDoc.destroy();
    }
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

  // Calculate bounding box and adaptive fit scale so all objects frame perfectly on screen
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  if (replayObjects.length > 0) {
    replayObjects.forEach((obj) => {
      const x = obj.x || 0;
      const y = obj.y || 0;
      const w = obj.width || 120;
      const h = obj.height || 100;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });
  } else {
    minX = 0; minY = 0; maxX = 300; maxY = 200;
  }
  const contentWidth = Math.max(200, maxX - minX);
  const contentHeight = Math.max(200, maxY - minY);
  const centerWorldX = minX + contentWidth / 2;
  const centerWorldY = minY + contentHeight / 2;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth * 0.75 : 800;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight * 0.55 : 500;
  const fitScale = Math.min(1, Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight));

  // Last active creator for current step banner
  const lastActiveObj = replayObjects[replayObjects.length - 1];
  const activeAuthor = lastActiveObj?.createdBy || 'Collaborator';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          borderRadius: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <History size={22} color="#3b82f6" />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
              Full Canvas Session Replay ({replayObjects.length} objects)
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Step {currentIndex + 1} of {updates.length || 1} • Author: {activeAuthor} • Scale: {Math.round(fitScale * 100)}%
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn-primary" style={{ padding: '8px 16px', gap: 6 }}>
          <X size={18} />
          <span>Exit Replay</span>
        </button>
      </div>

      {/* Full Canvas Viewport Centered with Adaptive Framing */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {replayObjects.map((obj) => {
          const color = (obj as any).fill || (obj as any).color || '#6366f1';
          const isCircle = obj.type === 'shape' && (obj as ShapeObject).shapeType === 'circle';
          const author = obj.createdBy || 'Collaborator';
          const offsetX = ((obj.x || 0) + (obj.width || 120) / 2 - centerWorldX) * fitScale;
          const offsetY = ((obj.y || 0) + (obj.height || 100) / 2 - centerWorldY) * fitScale;

          return (
            <div
              key={obj.id}
              style={{
                position: 'absolute',
                left: `calc(50vw + ${offsetX}px)`,
                top: `calc(50vh + ${offsetY}px)`,
                width: obj.width || 120,
                height: obj.height || 100,
                borderRadius: isCircle ? '50%' : 10,
                backgroundColor: obj.type === 'text' ? 'transparent' : color,
                border: obj.type === 'text' ? 'none' : '2px solid rgba(255, 255, 255, 0.4)',
                color: (obj as TextObject).fill || '#ffffff',
                fontSize: (obj as TextObject).fontSize || 14,
                fontWeight: (obj as TextObject).fontWeight === 'bold' ? 700 : 500,
                fontStyle: (obj as TextObject).fontStyle === 'italic' ? 'italic' : 'normal',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
                boxShadow: obj.type === 'text' ? 'none' : '0 8px 24px rgba(0,0,0,0.4)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                wordBreak: 'break-word',
                transform: `translate(-50%, -50%) scale(${fitScale}) rotate(${obj.rotation || 0}deg)`,
                transformOrigin: 'center center',
              }}
            >
              {/* Creator Author Badge Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#3b82f6',
                  padding: '2px 8px',
                  borderRadius: 12,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                }}
              >
                <User size={10} />
                <span>{author}</span>
              </div>

              {/* Node Content */}
              {obj.type === 'sticky' ? (
                <div style={{ color: '#1f2937', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                  {(obj as StickyObject).text || 'Sticky Note'}
                </div>
              ) : obj.type === 'text' ? (
                <div style={{ textAlign: (obj as TextObject).textAlign || 'left', width: '100%' }}>
                  {(obj as TextObject).text || 'Text Node'}
                </div>
              ) : obj.type === 'image' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={20} color="#ffffff" />
                  <span style={{ fontSize: 11 }}>Image Node</span>
                </div>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                  {(obj as ShapeObject).shapeType || obj.type}
                </span>
              )}
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
          borderRadius: 16,
        }}
      >
        {/* Scrubber Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 90, fontWeight: 700 }}>
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
            style={{ flex: 1, cursor: 'pointer', height: 8, accentColor: 'var(--accent-primary)' }}
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
