import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// @ts-ignore y-websocket bin utils TS module setup
import { setupWSConnection } from 'y-websocket/bin/utils';

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
  const url = req.url || '';
  const urlObj = new URL(url, 'http://localhost');
  const room = urlObj.searchParams.get('room') || url.replace('/yjs', '').replace('/', '') || 'default-room';

  setupWSConnection(conn, req, { docName: room });
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
