import React, { useState, useRef, useEffect } from 'react';
import { RoomProvider } from './context/RoomContext';
import { Navbar } from './components/Navbar';
import { Toolbar, ToolMode } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { GuestModal } from './components/GuestModal';
import { AudioRecorder } from './components/AudioRecorder';
import { Minimap } from './components/Minimap';
import { ColorPickerBar } from './components/ColorPickerBar';
import { ReplayModal } from './components/ReplayModal';
import { ReactionsBar } from './components/ReactionsBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import Konva from 'konva';

import { TextEditOverlay } from './components/TextEditOverlay';

export const AppContent: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAudioRecorderOpen, setIsAudioRecorderOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    const handleCustomTrigger = (e: any) => {
      if (e.detail?.id) {
        setEditingId(e.detail.id);
      }
    };
    window.addEventListener('boundless-trigger-text-edit', handleCustomTrigger);
    return () => window.removeEventListener('boundless-trigger-text-edit', handleCustomTrigger);
  }, []);

  const handleToolSelect = (tool: ToolMode) => {
    if (tool === 'audio') {
      setIsAudioRecorderOpen(true);
    } else {
      setActiveTool(tool);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar
        stageRef={stageRef}
        onOpenReplay={() => setIsReplayOpen(true)}
        followingUserId={followingUserId}
        setFollowingUserId={setFollowingUserId}
      />

      <ColorPickerBar
        selectedId={selectedId}
        onDeselect={() => setSelectedId(null)}
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
      />

      <Canvas
        activeTool={activeTool}
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
        setStageX={setStageX}
        setStageY={setStageY}
        setZoom={setZoom}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        onOpenAudioRecorder={() => setIsAudioRecorderOpen(true)}
        stageRef={stageRef}
        followingUserId={followingUserId}
      />

      <ReactionsBar
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
      />

      <Toolbar
        activeTool={activeTool}
        setActiveTool={handleToolSelect}
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
      />

      <Minimap
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
      />

      <GuestModal />

      <TextEditOverlay
        editingId={editingId}
        onClose={() => setEditingId(null)}
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
      />

      {isAudioRecorderOpen && (
        <AudioRecorder
          stageX={stageX}
          stageY={stageY}
          zoom={zoom}
          onClose={() => setIsAudioRecorderOpen(false)}
        />
      )}

      {isReplayOpen && (
        <ReplayModal
          onClose={() => setIsReplayOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </ErrorBoundary>
  );
}
