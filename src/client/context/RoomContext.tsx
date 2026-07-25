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

  const setUsername = useCallback((name: string) => {
    sessionStorage.setItem('boundless_username', name);
    setUsernameState(name);
  }, []);

  // Yjs Y.Doc instance
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yObjects = useMemo(() => ydoc.getMap<CanvasObject>('objects'), [ydoc]);

  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [canvasObjects, setCanvasObjects] = useState<Map<string, CanvasObject>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<UserAwareness[]>([]);

  // Initialize Yjs WebSocket Provider and IndexedDB Persistence
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/yjs`;

    const wsProvider = new WebsocketProvider(wsUrl, roomId, ydoc);
    setProvider(wsProvider);

    // IndexedDB offline cache setup
    const indexedDBProvider = new IndexeddbPersistence(roomId, ydoc);
    indexedDBProvider.on('synced', () => {
      console.log('📦 Local IndexedDB synced for room:', roomId);
    });

    wsProvider.on('status', (event: { status: string }) => {
      setIsConnected(event.status === 'connected');
    });

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
      yObjects.unobserve(handleObjectsChange);
      awareness.off('change', handleAwarenessChange);
      wsProvider.destroy();
      indexedDBProvider.destroy();
    };
  }, [ydoc, roomId, yObjects]);

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

  return (
    <RoomContext.Provider
      value={{
        roomId,
        ydoc,
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
