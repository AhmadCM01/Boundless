import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as Y from 'yjs';
// @ts-ignore y-websocket bin utils TS module setup
import { setupWSConnection, getYDoc } from 'y-websocket/bin/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const fastify = Fastify({
  logger: true,
});

// Enable CORS
await fastify.register(fastifyCors, {
  origin: true,
});

// Enable Multipart for asset uploads
await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per asset
  },
});

// In-Memory Asset Storage for Images & Audio
interface StoredAsset {
  id: string;
  data: Buffer;
  mimeType: string;
  createdAt: number;
}
const assetsMap = new Map<string, StoredAsset>();

// In-Memory Yjs Room Update History Storage for Session Replay
interface DeltaRecord {
  timestamp: number;
  deltaBase64: string;
}
const roomHistoryMap = new Map<string, DeltaRecord[]>();

// Utility to clean and extract exact Yjs Room Name from request URL
function extractRoomName(reqUrl: string): string {
  const urlObj = new URL(reqUrl, 'http://localhost');
  const queryRoom = urlObj.searchParams.get('room');
  if (queryRoom) return queryRoom;
  const pathClean = urlObj.pathname.replace(/^\/yjs\/?/, '').replace(/^\//, '');
  return pathClean || 'default-room';
}

// Asset Upload Endpoint
fastify.post('/api/assets', async (request, reply) => {
  const data = await request.file();
  if (!data) {
    return reply.status(400).send({ error: 'No file uploaded' });
  }

  const buffer = await data.toBuffer();
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  assetsMap.set(assetId, {
    id: assetId,
    data: buffer,
    mimeType: data.mimetype || 'application/octet-stream',
    createdAt: Date.now(),
  });

  return reply.send({
    assetId,
    url: `/api/assets/${assetId}`,
    mimeType: data.mimetype,
    size: buffer.length,
  });
});

// Asset Retrieval Endpoint
fastify.get('/api/assets/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const asset = assetsMap.get(id);

  if (!asset) {
    return reply.status(404).send({ error: 'Asset not found' });
  }

  reply.header('Content-Type', asset.mimeType);
  reply.header('Cache-Control', 'public, max-age=31536000, immutable');
  return reply.send(asset.data);
});

// Room Update History Endpoint for Session Replay
fastify.get('/api/rooms/:id/history', async (request, reply) => {
  const { id } = request.params as { id: string };
  const history = roomHistoryMap.get(id) || [];
  console.log(`📜 History requested for room [${id}]: ${history.length} deltas found.`);
  return reply.send({
    roomId: id,
    count: history.length,
    updates: history,
  });
});

// Serve Static Frontend Bundle in production
const clientDistPath = path.resolve(__dirname, '../client');

if (fs.existsSync(clientDistPath)) {
  await fastify.register(fastifyStatic, {
    root: clientDistPath,
    prefix: '/',
  });

  // Client Routing Fallback for SPA (e.g., /room/:roomId)
  fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url && request.raw.url.startsWith('/api')) {
      reply.status(404).send({ error: 'API route not found' });
    } else {
      reply.sendFile('index.html');
    }
  });
}

// WebSocket Setup for Yjs
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (conn, req) => {
  const reqUrl = req.url || '';
  const roomName = extractRoomName(reqUrl);

  setupWSConnection(conn, req, { docName: roomName });

  // Attach Y.Doc update listener for session replay history tracking
  try {
    const doc = getYDoc(roomName);
    if (doc && !(doc as any)._historySubscribed) {
      (doc as any)._historySubscribed = true;
      console.log(`📡 Subscribed history update tracking for room: [${roomName}]`);
      
      let history = roomHistoryMap.get(roomName);
      if (!history) {
        history = [];
        const baseSnapshot = Y.encodeStateAsUpdate(doc);
        history.push({
          timestamp: Date.now(),
          deltaBase64: Buffer.from(baseSnapshot).toString('base64'),
        });
        roomHistoryMap.set(roomName, history);
      }

      doc.on('update', (update: Uint8Array) => {
        let h = roomHistoryMap.get(roomName);
        if (!h) {
          h = [];
          roomHistoryMap.set(roomName, h);
        }
        h.push({
          timestamp: Date.now(),
          deltaBase64: Buffer.from(update).toString('base64'),
        });
      });
    }
  } catch (e) {
    console.error('History tracking error:', e);
  }
});

// Intercept HTTP upgrade for WebSockets on /yjs
fastify.server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  const pathname = new URL(url, `http://${request.headers.host || 'localhost'}`).pathname;

  if (pathname === '/yjs' || pathname.startsWith('/yjs/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start Fastify Server
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`🚀 Boundless Server running on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
