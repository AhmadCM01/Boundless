import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Group, Circle, Text as KonvaText, Line } from 'react-konva';
import { useRoom } from '../context/RoomContext';
import { useViewportCulling } from '../hooks/useViewportCulling';
import { ToolMode } from './Toolbar';
import { TextObjectNode } from './objects/TextObjectNode';
import { ShapeObjectNode } from './objects/ShapeObjectNode';
import { StickyObjectNode } from './objects/StickyObjectNode';
import { ImageObjectNode } from './objects/ImageObjectNode';
import { AudioObjectNode } from './objects/AudioObjectNode';
import { PenObjectNode } from './objects/PenObjectNode';
import { CanvasObject, TextObject, ShapeObject, StickyObject, ImageObject, AudioObject, PenObject } from '../../shared/types';
import { physicsEngine } from '../physics/PhysicsEngine';
import { CanvasObjectErrorBoundary } from './CanvasObjectErrorBoundary';
import Konva from 'konva';

interface CanvasProps {
  activeTool: ToolMode;
  stageX: number;
  stageY: number;
  zoom: number;
  setStageX: (x: number) => void;
  setStageY: (y: number) => void;
  setZoom: (z: number) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onOpenAudioRecorder: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  followingUserId: string | null;
}

// Background Grid Component
const BackgroundGrid: React.FC<{
  width: number;
  height: number;
  stageX: number;
  stageY: number;
  zoom: number;
}> = ({ width, height, stageX, stageY, zoom }) => {
  const gridSize = 40 * (zoom || 1);
  const startX = ((stageX || 0) % gridSize) - gridSize;
  const startY = ((stageY || 0) % gridSize) - gridSize;

  const dots = [];
  for (let x = startX; x < width + gridSize; x += gridSize) {
    for (let y = startY; y < height + gridSize; y += gridSize) {
      dots.push(
        <Circle
          key={`dot_${x}_${y}`}
          x={x}
          y={y}
          radius={1.5}
          fill="rgba(99, 102, 241, 0.2)"
          listening={false}
        />
      );
    }
  }

  return <Group listening={false}>{dots}</Group>;
};

export const Canvas: React.FC<CanvasProps> = ({
  activeTool,
  stageX,
  stageY,
  zoom,
  setStageX,
  setStageY,
  setZoom,
  selectedId,
  setSelectedId,
  onOpenAudioRecorder,
  stageRef,
  followingUserId,
}) => {
  const { canvasObjects, updateObject, updateCursor, updateViewport, onlineUsers, addObject, username } = useRoom();
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawingPen, setIsDrawingPen] = useState(false);
  const [currentPenPoints, setCurrentPenPoints] = useState<number[]>([]);

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Physics loop animation frame
  useEffect(() => {
    let animId: number;
    const loop = () => {
      physicsEngine.stepSimulation(canvasObjects, (id, x, y) => {
        updateObject(id, { x, y });
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [canvasObjects, updateObject]);

  // Lock camera to followed collaborator's viewport
  useEffect(() => {
    if (!followingUserId) return;
    const targetUser = onlineUsers.find((u) => u.userId === followingUserId);
    if (targetUser && targetUser.viewport) {
      setStageX(targetUser.viewport.x);
      setStageY(targetUser.viewport.y);
      setZoom(targetUser.viewport.zoom);
    }
  }, [followingUserId, onlineUsers, setStageX, setStageY, setZoom]);

  // Window Resize & Mobile Orientation Listener
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Broadcast Viewport Bounds for Awareness
  useEffect(() => {
    updateViewport({
      x: stageX,
      y: stageY,
      width: windowDimensions.width,
      height: windowDimensions.height,
      zoom,
    });
  }, [stageX, stageY, windowDimensions, zoom, updateViewport]);

  // Viewport Culling Engine
  const visibleObjects = useViewportCulling({
    canvasObjects,
    stageX,
    stageY,
    zoom,
    windowWidth: windowDimensions.width,
    windowHeight: windowDimensions.height,
  });

  // Wheel Zoom Listener
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldZoom = zoom || 1;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stageX) / oldZoom,
      y: (pointer.y - stageY) / oldZoom,
    };

    const zoomFactor = e.evt.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(0.15, oldZoom * zoomFactor), 5);

    const newStageX = pointer.x - mousePointTo.x * newZoom;
    const newStageY = pointer.y - mousePointTo.y * newZoom;

    setZoom(newZoom);
    setStageX(newStageX);
    setStageY(newStageY);
  };

  // Pointer Down — Pen Drawing Start
  const handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (activeTool === 'pen' && e.target === stageRef.current) {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const worldX = (pointer.x - stageX) / (zoom || 1);
        const worldY = (pointer.y - stageY) / (zoom || 1);
        setIsDrawingPen(true);
        setCurrentPenPoints([worldX, worldY]);
      }
    }
  };

  // Pointer Move — Broadcast Cursor & Extend Pen Stroke
  const handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      const worldX = (pointer.x - stageX) / (zoom || 1);
      const worldY = (pointer.y - stageY) / (zoom || 1);
      updateCursor({ x: worldX, y: worldY });

      if (isDrawingPen && activeTool === 'pen') {
        setCurrentPenPoints((prev) => [...prev, worldX, worldY]);
      }
    }
  };

  // Pointer Up — Finish Pen Drawing Stroke
  const handlePointerUp = () => {
    if (isDrawingPen && currentPenPoints.length >= 4) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < currentPenPoints.length; i += 2) {
        minX = Math.min(minX, currentPenPoints[i]);
        maxX = Math.max(maxX, currentPenPoints[i]);
        minY = Math.min(minY, currentPenPoints[i + 1]);
        maxY = Math.max(maxY, currentPenPoints[i + 1]);
      }

      const relPoints = currentPenPoints.map((val, idx) => idx % 2 === 0 ? val - minX : val - minY);

      const newPenObj: PenObject = {
        id: `pen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'pen',
        x: minX,
        y: minY,
        width: Math.max(20, maxX - minX),
        height: Math.max(20, maxY - minY),
        points: relPoints,
        stroke: '#6366f1',
        strokeWidth: 3,
        rotation: 0,
        zIndex: canvasObjects.size + 1,
        createdBy: username || 'Guest',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addObject(newPenObj);
    }
    setIsDrawingPen(false);
    setCurrentPenPoints([]);
  };

  // Stage click — deselect
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current && activeTool !== 'pen') {
      setSelectedId(null);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={windowDimensions.width}
        height={windowDimensions.height}
        x={stageX}
        y={stageY}
        scaleX={zoom}
        scaleY={zoom}
        draggable={activeTool === 'pan' || isPanning}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleStageClick}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStageX(e.target.x());
            setStageY(e.target.y());
          }
        }}
        style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : activeTool === 'pen' ? 'crosshair' : 'default' }}
      >
        {/* Layer 1: Infinite Canvas Grid */}
        <Layer key="grid-layer">
          <BackgroundGrid width={windowDimensions.width} height={windowDimensions.height} stageX={stageX} stageY={stageY} zoom={zoom} />
        </Layer>

        {/* Layer 2: Culled Canvas Objects */}
        <Layer key="objects-layer">
          {visibleObjects.map((obj) => {
            const isSelected = obj.id === selectedId;
            const onSelect = () => setSelectedId(obj.id);
            const onChange = (patch: Partial<CanvasObject>) => updateObject(obj.id, patch);

            switch (obj.type) {
              case 'text':
                return (
                  <CanvasObjectErrorBoundary key={obj.id} objectId={obj.id} x={obj.x} y={obj.y}>
                    <TextObjectNode object={obj as TextObject} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />
                  </CanvasObjectErrorBoundary>
                );
              case 'shape':
                return (
                  <CanvasObjectErrorBoundary key={obj.id} objectId={obj.id} x={obj.x} y={obj.y}>
                    <ShapeObjectNode object={obj as ShapeObject} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />
                  </CanvasObjectErrorBoundary>
                );
              case 'sticky':
                return (
                  <CanvasObjectErrorBoundary key={obj.id} objectId={obj.id} x={obj.x} y={obj.y}>
                    <StickyObjectNode object={obj as StickyObject} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />
                  </CanvasObjectErrorBoundary>
                );
              case 'image':
                return (
                  <CanvasObjectErrorBoundary key={obj.id} objectId={obj.id} x={obj.x} y={obj.y}>
                    <ImageObjectNode object={obj as ImageObject} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />
                  </CanvasObjectErrorBoundary>
                );
              case 'audio':
                return (
                  <CanvasObjectErrorBoundary key={obj.id} objectId={obj.id} x={obj.x} y={obj.y}>
                    <AudioObjectNode object={obj as AudioObject} isSelected={isSelected} onSelect={onSelect} onChange={onChange} stageX={stageX} stageY={stageY} zoom={zoom} />
                  </CanvasObjectErrorBoundary>
                );
              case 'pen':
                return (
                  <CanvasObjectErrorBoundary key={obj.id} objectId={obj.id} x={obj.x} y={obj.y}>
                    <PenObjectNode object={obj as PenObject} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />
                  </CanvasObjectErrorBoundary>
                );
              default:
                return null;
            }
          })}

          {/* Active Freehand Pen Stroke Overlay */}
          {isDrawingPen && currentPenPoints.length >= 2 && (
            <Line
              points={currentPenPoints}
              stroke="#6366f1"
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}
        </Layer>

        {/* Layer 3: Remote Collaborator Cursors & Floating Reactions */}
        <Layer key="cursors-layer" listening={false}>
          {onlineUsers.map((user, i) => {
            if (!user.cursor) return null;
            const userReaction = (user as any).reaction;
            return (
              <Group key={`user_${user.userId || i}`} x={user.cursor.x} y={user.cursor.y}>
                {/* Pointer Cursor */}
                <Circle radius={6} fill={user.color || '#3b82f6'} stroke="#ffffff" strokeWidth={2} />
                <KonvaText
                  text={user.username || 'Collaborator'}
                  x={10}
                  y={-6}
                  fontSize={12}
                  fontFamily="Inter"
                  fill="#ffffff"
                  padding={4}
                />

                {/* Floating Emoji Particle */}
                {userReaction && Date.now() - userReaction.timestamp < 3000 && (
                  <KonvaText
                    text={userReaction.emoji}
                    x={0}
                    y={-30}
                    fontSize={28}
                  />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
