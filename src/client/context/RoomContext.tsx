import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { CanvasObject, UserAwareness, CursorPosition, ViewportBounds } from '../../shared/types';

const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

interface RoomContextType {
  roomId: string;
  ydoc: Y.Doc;
  doc: Y.Doc; // alias for ydoc — consumed by App, LeftSidebar, PropertiesPanel
  provider: WebsocketProvider | null;
  username: string | null;
  userColor: string;
  setUsername: (name: string) => void;
  canvasObjects: Map<string, CanvasObject>;
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  updateCursor: (pos: CursorPosition) => void;
  updateViewport: (bounds: ViewportBounds) => void;
  onlineUsers: UserAwareness[];
  isConnected: boolean;
  logout: () => void;
  undo: () => void;
  redo: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

function getOrGenerateRoomId(): string {
  const path = window.location.pathname.replace(/^\/room\//, '').replace(/^\//, '');
  const queryRoom = new URLSearchParams(window.location.search).get('room');
  
  const existingRoom = path || queryRoom;
  if (existingRoom && existingRoom !== 'index.html') {
    return existingRoom;
  }

  const newRoomId = `room-${Math.random().toString(36).substring(2, 9)}`;
  window.history.replaceState(null, '', `/room/${newRoomId}`);
  return newRoomId;
}

function getRandomColor(): string {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const roomId = useMemo(() => getOrGenerateRoomId(), []);
  
  const [username, setUsernameState] = useState<string | null>(() => {
    return sessionStorage.getItem('boundless_username') || null;
  });

  const [userColor] = useState<string>(() => {
    let saved = sessionStorage.getItem('boundless_color');
    if (!saved) {
      saved = getRandomColor();
      sessionStorage.setItem('boundless_color', saved);
    }
    return saved;
  });

  // Save current room to localStorage under recent rooms
  useEffect(() => {
    if (!roomId) return;
    try {
      const saved = localStorage.getItem('boundless_recent_rooms');
      let list: Array<{ id: string; joinedAt: number }> = saved ? JSON.parse(saved) : [];
      list = list.filter((r) => r.id !== roomId);
      list.unshift({ id: roomId, joinedAt: Date.now() });
      localStorage.setItem('boundless_recent_rooms', JSON.stringify(list.slice(0, 5)));
    } catch (e) {
      console.error('Failed to save recent room:', e);
    }
  }, [roomId]);

  /**
   * ─── Yjs CRDT Document & Object Data Model Setup ─────────────────────────────
   * ydoc: The root Conflict-Free Replicated Data Type (CRDT) document containing all room state.
   * yObjects: Top-level Y.Map storing spatial canvas objects keyed by unique ID (`objects`).
   *           Every mutation in yObjects automatically resolves concurrent edits via Yjs CRDT
   *           Lamport timestamps without data loss or race conditions across clients.
   * undoManager: Tracks state deltas on yObjects to provide atomic Ctrl+Z / Ctrl+Y history ops.
   */
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yObjects = useMemo(() => ydoc.getMap<CanvasObject>('objects'), [ydoc]);
  const undoManager = useMemo(() => new Y.UndoManager(yObjects), [yObjects]);

  const undo = useCallback(() => {
    try {
      undoManager.undo();
    } catch (e) {
      console.warn('Undo operation failed:', e);
    }
  }, [undoManager]);

  const redo = useCallback(() => {
    try {
      undoManager.redo();
    } catch (e) {
      console.warn('Redo operation failed:', e);
    }
  }, [undoManager]);

  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [canvasObjects, setCanvasObjects] = useState<Map<string, CanvasObject>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<UserAwareness[]>([]);

  // Initialize Yjs WebSocket Provider and IndexedDB Persistence
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/yjs`;

    const wsProvider = new WebsocketProvider(wsUrl, roomId, ydoc);
    setProvider(wsProvider);

    // IndexedDB offline cache setup safely wrapped
    let indexedDBProvider: IndexeddbPersistence | null = null;
    try {
      indexedDBProvider = new IndexeddbPersistence(roomId, ydoc);
    } catch (err) {
      console.warn('IndexedDB offline cache unavailable:', err);
    }

    // Continuous Connection State Tracker
    const checkConnection = () => {
      setIsConnected(wsProvider.wsconnected);
    };

    checkConnection();

    wsProvider.on('status', (event: { status: string }) => {
      setIsConnected(event.status === 'connected' || wsProvider.wsconnected);
    });

    wsProvider.on('sync', (isSynced: boolean) => {
      if (isSynced) setIsConnected(true);
    });

    // Heartbeat check every 2 seconds to prevent idle/tab-switch false negatives
    const heartbeatTimer = setInterval(checkConnection, 2000);

    // Re-verify connection when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsProvider.wsconnected) {
          wsProvider.connect();
        }
        checkConnection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Observer for Objects Y.Map changes
    const handleObjectsChange = () => {
      const currentMap = new Map<string, CanvasObject>();
      yObjects.forEach((val, key) => {
        currentMap.set(key, val);
      });
      setCanvasObjects(currentMap);
    };

    yObjects.observe(handleObjectsChange);
    handleObjectsChange();

    // Awareness / Presence tracking
    const awareness = wsProvider.awareness;

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const users: UserAwareness[] = [];
      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          users.push(state.user as UserAwareness);
        }
      });
      setOnlineUsers(users);
    };

    awareness.on('change', handleAwarenessChange);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      yObjects.unobserve(handleObjectsChange);
      awareness.off('change', handleAwarenessChange);
      wsProvider.destroy();
      indexedDBProvider?.destroy();
    };
  }, [ydoc, roomId, yObjects]);

  // Set Username & Reconnect Provider if needed
  const setUsername = useCallback((name: string) => {
    sessionStorage.setItem('boundless_username', name);
    setUsernameState(name);
    if (provider && !provider.wsconnected) {
      provider.connect();
    }
  }, [provider]);

  // Update user awareness details
  useEffect(() => {
    if (!provider || !username) return;
    const userId = `user_${ydoc.clientID}`;
    provider.awareness.setLocalStateField('user', {
      userId,
      username,
      color: userColor,
      lastSeen: Date.now(),
    });
  }, [provider, username, userColor, ydoc.clientID]);

  // Canvas Actions
  const addObject = useCallback((obj: CanvasObject) => {
    ydoc.transact(() => {
      yObjects.set(obj.id, obj);
    });
  }, [ydoc, yObjects]);

  const updateObject = useCallback((id: string, patch: Partial<CanvasObject>) => {
    const existing = yObjects.get(id);
    if (existing) {
      ydoc.transact(() => {
        yObjects.set(id, { ...existing, ...patch, updatedAt: Date.now() } as CanvasObject);
      });
    }
  }, [ydoc, yObjects]);

  const deleteObject = useCallback((id: string) => {
    ydoc.transact(() => {
      yObjects.delete(id);
    });
  }, [ydoc, yObjects]);

  const updateCursor = useCallback((pos: CursorPosition) => {
    if (!provider) return;
    const currentUser = provider.awareness.getLocalState()?.user || {};
    provider.awareness.setLocalStateField('user', {
      ...currentUser,
      cursor: pos,
    });
  }, [provider]);

  const updateViewport = useCallback((bounds: ViewportBounds) => {
    if (!provider) return;
    const currentUser = provider.awareness.getLocalState()?.user || {};
    provider.awareness.setLocalStateField('user', {
      ...currentUser,
      viewport: bounds,
    });
  }, [provider]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('boundless_username');
    sessionStorage.removeItem('boundless_color');
    if (provider) {
      provider.awareness.setLocalState(null);
      provider.disconnect();
    }
    setIsConnected(false);
    setUsernameState(null);
  }, [provider]);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        ydoc,
        doc: ydoc, // alias so all consumers can destructure `doc`
        provider,
        username,
        userColor,
        setUsername,
        canvasObjects,
        addObject,
        updateObject,
        deleteObject,
        updateCursor,
        updateViewport,
        onlineUsers,
        isConnected,
        logout,
        undo,
        redo,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
