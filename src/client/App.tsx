import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RoomProvider } from './context/RoomContext';
import { Navbar } from './components/Navbar';
import { Toolbar, ToolMode } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { GuestModal } from './components/GuestModal';
import { AudioRecorder } from './components/AudioRecorder';
import { Minimap } from './components/Minimap';
import { ReplayModal } from './components/ReplayModal';
import { ReactionsBar } from './components/ReactionsBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import Konva from 'konva';

import { useRoom } from './context/RoomContext';
import { LeftSidebar } from './components/LeftSidebar';
import { TextEditOverlay } from './components/TextEditOverlay';
import { ZoomDock } from './components/ZoomDock';

export const AppContent: React.FC = () => {
  const { canvasObjects, updateObject, deleteObject, doc, undo, redo, username } = useRoom();
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const [zoom, setZoom] = useState(0.5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAudioRecorderOpen, setIsAudioRecorderOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);

  // Keep single selectedId and multiple selectedIds array in 100% sync
  const handleSetSelectedId = (id: string | null) => {
    setSelectedId(id);
    setSelectedIds(id ? [id] : []);
  };

  const handleSetSelectedIds = (ids: string[]) => {
    setSelectedIds(ids);
    setSelectedId(ids.length > 0 ? ids[0] : null);
  };

  // Text edit overlay trigger
  useEffect(() => {
    const handleCustomTrigger = (e: any) => {
      if (e.detail?.id) setEditingId(e.detail.id);
    };
    window.addEventListener('boundless-trigger-text-edit', handleCustomTrigger);
    return () => window.removeEventListener('boundless-trigger-text-edit', handleCustomTrigger);
  }, []);

  // ─── CRDT Actions (memoized, stable references for keyboard engine) ──────────

  // ─── Refs that always hold the latest selection (fixes stale closure bug) ─────
  const selectedIdsRef = useRef<string[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const docRef = useRef(doc);

  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { docRef.current = doc; }, [doc]);

  // ─── CRDT Actions (read from refs — never stale) ──────────────────────────────

  const groupObjects = useCallback(() => {
    const ids = selectedIdsRef.current.length > 0 ? selectedIdsRef.current : (selectedIdRef.current ? [selectedIdRef.current] : []);
    const currentDoc = docRef.current;
    if (ids.length > 1 && currentDoc) {
      const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      currentDoc.transact(() => {
        ids.forEach((id) => updateObject(id, { groupId: newGroupId }));
      });
    }
  }, [updateObject]);

  const ungroupObjects = useCallback(() => {
    const ids = selectedIdsRef.current.length > 0 ? selectedIdsRef.current : (selectedIdRef.current ? [selectedIdRef.current] : []);
    const currentDoc = docRef.current;
    if (ids.length > 0 && currentDoc) {
      currentDoc.transact(() => {
        ids.forEach((id) => updateObject(id, { groupId: undefined }));
      });
    }
  }, [updateObject]);

  const deleteSelectedObjects = useCallback(() => {
    const ids = selectedIdsRef.current.length > 0 ? selectedIdsRef.current : (selectedIdRef.current ? [selectedIdRef.current] : []);
    const currentDoc = docRef.current;
    if (ids.length > 0 && currentDoc) {
      currentDoc.transact(() => {
        ids.forEach((id) => deleteObject(id));
      });
      setSelectedId(null);
      setSelectedIds([]);
    }
  }, [deleteObject]);

  // ─── Global Keyboard Accessibility Engine ────────────────────────────────────
  // Attached to window — reads from refs so it is NEVER stale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: don't fire when user is typing
      const active = document.activeElement;
      if (active) {
        const tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if ((active as HTMLElement).isContentEditable) return;
        if (active.closest('.text-edit-overlay')) return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + Z — Undo
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl + Y — Redo
      if ((isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') || (isCmdOrCtrl && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + A — Select All Objects
      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allIds = Array.from(canvasObjects.keys());
        if (allIds.length > 0) {
          setSelectedIds(allIds);
          setSelectedId(allIds[0]);
        }
        return;
      }

      // Ctrl/Cmd + Shift + G — Ungroup
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        ungroupObjects();
        return;
      }

      // Ctrl/Cmd + G — Group
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        groupObjects();
        return;
      }

      // Backspace / Delete — Delete Selection
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelectedObjects();
        return;
      }

      // Escape — Deselect All
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // Only re-register if canvasObjects changes — callbacks are stable
  }, [canvasObjects, groupObjects, ungroupObjects, deleteSelectedObjects, undo, redo]);


  const handleToolSelect = (tool: ToolMode) => {
    if (tool === 'audio') {
      setIsAudioRecorderOpen(true);
    } else {
      setActiveTool(tool);
    }
  };

  const isAuthenticated = Boolean(username);

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-dark)',
      }}
    >
      <Canvas
        activeTool={activeTool}
        stageX={stageX}
        stageY={stageY}
        zoom={zoom}
        setStageX={setStageX}
        setStageY={setStageY}
        setZoom={setZoom}
        selectedId={selectedId}
        setSelectedId={handleSetSelectedId}
        selectedIds={selectedIds}
        setSelectedIds={handleSetSelectedIds}
        onOpenAudioRecorder={() => setIsAudioRecorderOpen(true)}
        stageRef={stageRef}
        followingUserId={followingUserId}
        isPhysicsEnabled={isPhysicsEnabled}
      />

      {/* Docks and Tools — ONLY visible after User Authentication */}
      {isAuthenticated && (
        <>
          <Navbar
            stageRef={stageRef}
            onOpenReplay={() => setIsReplayOpen(true)}
            followingUserId={followingUserId}
            setFollowingUserId={setFollowingUserId}
          />

          <LeftSidebar
            selectedIds={selectedIds}
            selectedId={selectedId}
            onDeselect={() => handleSetSelectedId(null)}
            stageX={stageX}
            stageY={stageY}
            zoom={zoom}
          />

          <ReactionsBar stageX={stageX} stageY={stageY} zoom={zoom} />

          <Toolbar
            activeTool={activeTool}
            setActiveTool={handleToolSelect}
            stageX={stageX}
            stageY={stageY}
            zoom={zoom}
            isPhysicsEnabled={isPhysicsEnabled}
            setIsPhysicsEnabled={setIsPhysicsEnabled}
          />

          <Minimap stageX={stageX} stageY={stageY} zoom={zoom} />

          <ZoomDock
            zoom={zoom}
            setZoom={setZoom}
            setStageX={setStageX}
            setStageY={setStageY}
          />

          <TextEditOverlay
            editingId={editingId}
            onClose={() => setEditingId(null)}
            stageX={stageX}
            stageY={stageY}
            zoom={zoom}
          />
        </>
      )}

      {/* Authentication Modal */}
      <GuestModal />

      {isAudioRecorderOpen && (
        <AudioRecorder
          stageX={stageX}
          stageY={stageY}
          zoom={zoom}
          onClose={() => setIsAudioRecorderOpen(false)}
        />
      )}

      {isReplayOpen && (
        <ReplayModal onClose={() => setIsReplayOpen(false)} />
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
