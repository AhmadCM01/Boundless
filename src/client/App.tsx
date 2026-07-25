import React, { useState } from 'react';
import { RoomProvider } from './context/RoomContext';
import { Navbar } from './components/Navbar';
import { Toolbar, ToolMode } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { GuestModal } from './components/GuestModal';
import { AudioRecorder } from './components/AudioRecorder';
import { Minimap } from './components/Minimap';

export const AppContent: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isAudioRecorderOpen, setIsAudioRecorderOpen] = useState(false);

  const handleToolSelect = (tool: ToolMode) => {
    if (tool === 'audio') {
      setIsAudioRecorderOpen(true);
    } else {
      setActiveTool(tool);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <Canvas
        activeTool={activeTool}
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
        setStageX={setStageX}
        setStageY={setStageY}
        setZoom={setZoom}
        onOpenAudioRecorder={() => setIsAudioRecorderOpen(true)}
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

      {isAudioRecorderOpen && (
        <AudioRecorder
          stageX={stageX}
          stageY={stageY}
          zoom={zoom}
          onClose={() => setIsAudioRecorderOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <RoomProvider>
      <AppContent />
    </RoomProvider>
  );
}
