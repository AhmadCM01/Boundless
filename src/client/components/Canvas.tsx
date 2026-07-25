import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Group, Circle, Text as KonvaText } from 'react-konva';
import { useRoom } from '../context/RoomContext';
import { useViewportCulling } from '../hooks/useViewportCulling';
import { ToolMode } from './Toolbar';
import { TextObjectNode } from './objects/TextObjectNode';
import { ShapeObjectNode } from './objects/ShapeObjectNode';
import { StickyObjectNode } from './objects/StickyObjectNode';
import { ImageObjectNode } from './objects/ImageObjectNode';
import { AudioObjectNode } from './objects/AudioObjectNode';
import { CanvasObject, TextObject, ShapeObject, StickyObject, ImageObject, AudioObject } from '../../shared/types';
import Konva from 'konva';

interface CanvasProps {
  activeTool: ToolMode;
  stageX: number;
  stageY: number;
  zoom: number;
  setStageX: (x: number) => void;
  setStageY: (y: number) => void;
  setZoom: (z: number) => void;
  onOpenAudioRecorder: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  activeTool,
  stageX,
  stageY,
  zoom,
  setStageX,
  setStageY,
  setZoom,
  onOpenAudioRecorder,
}) => {
  const { canvasObjects, updateObject, updateCursor, updateViewport, onlineUsers } = useRoom();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const stageRef = useRef<Konva.Stage>(null);

  // Resize Listener
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Viewport Culling Optimization
  const visibleObjects = useViewportCulling({
    canvasObjects,
    stageX,
    stageY,
    zoom,
    windowWidth: windowDimensions.width,
    windowHeight: windowDimensions.height,
  });

  // Broadcast viewport bounds to Awareness
  useEffect(() => {
    updateViewport({
      x: stageX,
      y: stageY,
      width: windowDimensions.width,
      height: windowDimensions.height,
      zoom,
    });
  }, [stageX, stageY, zoom, windowDimensions, updateViewport]);

  // Cursor anchored zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldZoom = zoom;
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

  // Mouse Move — Broadcast Awareness Cursor
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      const worldX = (pointer.x - stageX) / zoom;
      const worldY = (pointer.y - stageY) / zoom;
      updateCursor({ x: worldX, y: worldY });
    }
  };

  // Stage click — deselect
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
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
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStageX(e.target.x());
            setStageY(e.target.y());
          }
        }}
        style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : 'default' }}
      >
        {/* Layer 1: Infinite Canvas Grid Pattern */}
        <Layer key="grid-layer">
          <BackgroundGrid width={windowDimensions.width} height={windowDimensions.height} stageX={stageX} stageY={stageY} zoom={zoom} />
        </Layer>

        {/* Layer 2: Culled Canvas Objects */}
        <Layer key="objects-layer">
          {visibleObjects.map((obj) => {
            const isSelected = selectedId === obj.id;
            const onSelect = () => setSelectedId(obj.id);
            const onChange = (patch: Partial<CanvasObject>) => updateObject(obj.id, patch);

            switch (obj.type) {
              case 'text':
                return (
                  <TextObjectNode
                    key={obj.id}
                    object={obj as TextObject}
                    isSelected={isSelected}
                    onSelect={onSelect}
                    onChange={onChange}
                  />
                );
              case 'shape':
                return (
                  <ShapeObjectNode
                    key={obj.id}
                    object={obj as ShapeObject}
                    isSelected={isSelected}
                    onSelect={onSelect}
                    onChange={onChange}
                  />
                );
              case 'sticky':
                return (
                  <StickyObjectNode
                    key={obj.id}
                    object={obj as StickyObject}
                    isSelected={isSelected}
                    onSelect={onSelect}
                    onChange={onChange}
                  />
                );
              case 'image':
                return (
                  <ImageObjectNode
                    key={obj.id}
                    object={obj as ImageObject}
                    isSelected={isSelected}
                    onSelect={onSelect}
                    onChange={onChange}
                  />
                );
              case 'audio':
                return (
                  <AudioObjectNode
                    key={obj.id}
                    object={obj as AudioObject}
                    isSelected={isSelected}
                    onSelect={onSelect}
                    onChange={onChange}
                    stageX={stageX}
                    stageY={stageY}
                    zoom={zoom}
                  />
                );
              default:
                return null;
            }
          })}
        </Layer>

        {/* Layer 3: Awareness Live Cursors */}
        <Layer key="awareness-cursors-layer">
          {onlineUsers.map((user, idx) => {
            if (!user.cursor) return null;
            return (
              <Group key={user.userId || idx} x={user.cursor.x} y={user.cursor.y}>
                <Circle radius={6} fill={user.color || '#3b82f6'} shadowColor={user.color || '#3b82f6'} shadowBlur={8} />
                <KonvaText
                  x={10}
                  y={-6}
                  text={user.username || 'Collaborator'}
                  fontSize={12}
                  fontFamily="Inter"
                  fontStyle="bold"
                  fill="#ffffff"
                  padding={4}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

// Subtle Infinite Grid Dot Matrix
const BackgroundGrid: React.FC<{ width: number; height: number; stageX: number; stageY: number; zoom: number }> = ({
  width,
  height,
  stageX,
  stageY,
  zoom,
}) => {
  const gridSize = 40;
  const startX = Math.floor((-stageX / zoom) / gridSize) * gridSize - gridSize;
  const endX = Math.ceil((width - stageX) / zoom / gridSize) * gridSize + gridSize;
  const startY = Math.floor((-stageY / zoom) / gridSize) * gridSize - gridSize;
  const endY = Math.ceil((height - stageY) / zoom / gridSize) * gridSize + gridSize;

  const dots = [];
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      dots.push(
        <Circle
          key={`dot_${x}_${y}`}
          x={x}
          y={y}
          radius={1.2 / zoom}
          fill="rgba(255, 255, 255, 0.12)"
        />
      );
    }
  }

  return <Group>{dots}</Group>;
};
