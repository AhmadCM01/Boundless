import React, { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { ShapeObject, StickyObject, TextObject, ImageObject } from '../../shared/types';
import {
  MousePointer,
  Hand,
  Type,
  Square,
  Circle as CircleIcon,
  Star,
  Triangle,
  Minus,
  ArrowUpRight,
  StickyNote,
  Image as ImageIcon,
  Mic,
  Zap,
} from 'lucide-react';

export type ToolMode = 'select' | 'pan' | 'text' | 'shape' | 'sticky' | 'image' | 'audio';

interface ToolbarProps {
  activeTool: ToolMode;
  setActiveTool: (tool: ToolMode) => void;
  stageX: number;
  stageY: number;
  zoom: number;
}

const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa'];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  stageX,
  stageY,
  zoom,
}) => {
  const { addObject, canvasObjects, username } = useRoom();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isShapeFlyoutOpen, setIsShapeFlyoutOpen] = useState(false);

  // Get world coordinate center of screen for creating new objects
  const getCenterCanvasPos = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return {
      x: (screenWidth / 2 - stageX) / zoom - 75,
      y: (screenHeight / 2 - stageY) / zoom - 50,
    };
  };

  // Add Text Object
  const handleAddText = () => {
    const pos = getCenterCanvasPos();
    const newText: TextObject = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'text',
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 60,
      rotation: 0,
      zIndex: canvasObjects.size + 1,
      text: 'Double click to edit text...',
      fontSize: 20,
      fontFamily: 'Inter',
      fill: '#1e293b',
      createdBy: username || 'Guest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addObject(newText);
    setActiveTool('select');
  };

  // Add Shape Object
  const handleAddShape = (shapeType: 'rect' | 'circle' | 'star' | 'triangle' | 'line' | 'arrow') => {
    const pos = getCenterCanvasPos();
    const newShape: ShapeObject = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'shape',
      shapeType,
      x: pos.x,
      y: pos.y,
      width: shapeType === 'line' || shapeType === 'arrow' ? 180 : 140,
      height: shapeType === 'line' || shapeType === 'arrow' ? 100 : 140,
      rotation: 0,
      zIndex: canvasObjects.size + 1,
      fill: '#6366f1',
      stroke: '#6366f1',
      strokeWidth: 2,
      createdBy: username || 'Guest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addObject(newShape);
    setIsShapeFlyoutOpen(false);
    setActiveTool('select');
  };

  // Add Sticky Note
  const handleAddSticky = () => {
    const pos = getCenterCanvasPos();
    const randomColor = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    const newSticky: StickyObject = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'sticky',
      x: pos.x,
      y: pos.y,
      width: 180,
      height: 180,
      rotation: (Math.random() - 0.5) * 6,
      zIndex: canvasObjects.size + 1,
      text: 'Idea note...',
      color: randomColor,
      author: username || 'Guest',
      createdBy: username || 'Guest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addObject(newSticky);
    setActiveTool('select');
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        const pos = getCenterCanvasPos();
        const newImage: ImageObject = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'image',
          assetId: data.assetId,
          src: data.url,
          x: pos.x,
          y: pos.y,
          width: 260,
          height: 200,
          aspectRatio: 1.3,
          rotation: 0,
          zIndex: canvasObjects.size + 1,
          createdBy: username || 'Guest',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addObject(newImage);
        setActiveTool('select');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  };

  // 100+ Object Performance Stress Test Generator
  const handleSpawn100Objects = () => {
    const shapes: ('rect' | 'circle' | 'star' | 'triangle')[] = ['rect', 'circle', 'star', 'triangle'];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const center = getCenterCanvasPos();

    for (let i = 0; i < 100; i++) {
      const offsetX = (Math.random() - 0.5) * 3500;
      const offsetY = (Math.random() - 0.5) * 3500;
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const newShape: ShapeObject = {
        id: `bench_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        type: 'shape',
        shapeType,
        x: center.x + offsetX,
        y: center.y + offsetY,
        width: 60 + Math.random() * 80,
        height: 60 + Math.random() * 80,
        rotation: Math.random() * 360,
        zIndex: canvasObjects.size + i + 1,
        fill: color,
        stroke: '#ffffff',
        strokeWidth: 1,
        createdBy: 'Benchmark',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addObject(newShape);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        height: 56,
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 100,
      }}
    >
      {/* Select / Move */}
      <button
        title="Select & Move (V)"
        className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setActiveTool('select')}
      >
        <MousePointer size={18} />
      </button>

      {/* Pan Canvas */}
      <button
        title="Pan Canvas (Space)"
        className={`tool-btn ${activeTool === 'pan' ? 'active' : ''}`}
        onClick={() => setActiveTool('pan')}
      >
        <Hand size={18} />
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--bg-panel-border)', margin: '0 4px' }} />

      {/* Add Text */}
      <button title="Add Text" className="tool-btn" onClick={handleAddText}>
        <Type size={18} />
      </button>

      {/* Figma-Style Shape Tool Flyout Popover */}
      <div style={{ position: 'relative' }}>
        <button
          title="Shapes Menu"
          className={`tool-btn ${isShapeFlyoutOpen ? 'active' : ''}`}
          onClick={() => setIsShapeFlyoutOpen(!isShapeFlyoutOpen)}
        >
          <Square size={18} />
        </button>

        {isShapeFlyoutOpen && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              position: 'absolute',
              bottom: 64,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 150,
              zIndex: 200,
            }}
          >
            <button
              onClick={() => handleAddShape('rect')}
              className="tool-btn"
              style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
            >
              <Square size={16} />
              <span>Rectangle</span>
            </button>
            <button
              onClick={() => handleAddShape('circle')}
              className="tool-btn"
              style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
            >
              <CircleIcon size={16} />
              <span>Ellipse</span>
            </button>
            <button
              onClick={() => handleAddShape('triangle')}
              className="tool-btn"
              style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
            >
              <Triangle size={16} />
              <span>Triangle</span>
            </button>
            <button
              onClick={() => handleAddShape('star')}
              className="tool-btn"
              style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
            >
              <Star size={16} />
              <span>Star</span>
            </button>
            <button
              onClick={() => handleAddShape('line')}
              className="tool-btn"
              style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
            >
              <Minus size={16} />
              <span>Line</span>
            </button>
            <button
              onClick={() => handleAddShape('arrow')}
              className="tool-btn"
              style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
            >
              <ArrowUpRight size={16} />
              <span>Arrow</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Sticky Note */}
      <button title="Add Sticky Note" className="tool-btn" onClick={handleAddSticky}>
        <StickyNote size={18} />
      </button>

      {/* Upload Image */}
      <button title="Upload Image" className="tool-btn" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon size={18} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* Record Audio Voice Note */}
      <button title="Record Voice Note (Audio)" className="tool-btn" onClick={() => setActiveTool('audio')}>
        <Mic size={18} />
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--bg-panel-border)', margin: '0 4px' }} />

      {/* 100+ Object Benchmark Button */}
      <button
        title="Spawn 100 Random Objects (Viewport Culling Test)"
        className="tool-btn"
        onClick={handleSpawn100Objects}
        style={{ color: '#f59e0b' }}
      >
        <Zap size={18} />
      </button>
    </div>
  );
};
