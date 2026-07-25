# Boundless — Real-Time Collaborative Infinite Canvas

**Boundless** is a high-performance, real-time collaborative 2D infinite canvas platform built for creative minds. Powered by Yjs CRDT conflict-free replication and Konva.js rendering engine, multiple users can join rooms instantly via shareable links, customize guest identities, and collaborate live on multi-media canvas objects.

---

## 🚀 Key Features

1. **Instant Room & Guest Onboarding**: Link-based room sessions (`/room/:roomId`) with lightweight guest authentication and cursor styling.
2. **Real-Time CRDT Synchronization**: Zero-conflict live editing using **Yjs** (`Y.Doc`, `Y.Map`) and `y-websocket`, paired with Yjs **Awareness** protocol for live collaborator presence and cursor tracking.
3. **Infinite Canvas Engine**: Smooth camera pan and zoom anchored at cursor coordinates, powered by **Konva.js** (`react-konva`).
4. **Viewport Culling Performance**: Standard bounding box intersection culling ensures fluid 60 FPS performance with **100+ active objects**.
5. **Multi-Media Object Suite**:
   - **Text Blocks**: Editable text elements with custom font styling.
   - **Shapes**: Vector Rectangles, Circles, Stars, and Triangles.
   - **Sticky Notes**: Color-coded notes with author tags and auto-wrapping text.
   - **Images**: Fast image asset upload via HTTP reference endpoints.
   - **Audio Recordings**: Browser `MediaRecorder` audio notes with interactive HTML `<audio>` playback cards.
6. **Radar / Mini-Map**: Bottom-right radar tracking room objects, live collaborators' viewports, and cursor activity.
7. **Offline Support**: Local CRDT delta caching via `y-indexeddb` for offline updates and auto-reconnection resync.

---

## 🛠️ Technology Stack

- **Sync Engine**: Yjs (`yjs`), `y-websocket`, `y-indexeddb`
- **Canvas Rendering**: Konva.js (`react-konva`, `konva`)
- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Vanilla Glassmorphism CSS
- **Backend**: Fastify, `@fastify/static`, `@fastify/multipart`, `ws`
- **Deployment**: Render (Single-service Web Service serving static React client and WebSocket upgrades on a single port).

---

## 📦 Local Development

### 1. Installation
```bash
npm install
```

### 2. Start Local Development Server
Runs Fastify server on `localhost:3000` and Vite dev server on `localhost:5173`:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Production Build & Local Start
```bash
npm run build
npm start
```

---

## 🌐 Render Deployment

Boundless is configured for single-service Web Service deployment on **Render**:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository (`AhmadCM01/Boundless`).
4. Configure the service settings:
   - **Environment**: `Node`
   - **Region**: Any preferred region
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Create Web Service**. Render automatically detects `process.env.PORT` and serves both the static frontend and WebSocket `/yjs` connection on a single port.

**Live Render Demo URL**: [https://boundless-4zml.onrender.com](https://boundless-4zml.onrender.com)

> [!IMPORTANT]
> **Render Free-Tier Cold Starts**:
> Render's free tier automatically puts the Web Service to sleep after 15 minutes of inactivity. When woken up by a new request, the initial cold start takes approximately **30–60 seconds**. For live demos or judging sessions, open the live URL a few minutes in advance to spin up the instance and ensure a zero-delay experience!

---

## 🎯 Stretch Goals & Design Decisions

- **Attempted & Completed**:
  - **Mini-Map / Radar**: Built using Yjs Awareness presence data to show online collaborators' positions and active canvas object distributions.
  - **Offline Resilience**: Integrated `y-indexeddb` provider to store Yjs deltas locally in IndexedDB and resync on network reconnect.
  - **Media Asset Optimization**: Image and Audio bytes are served via dedicated `/api/assets/:id` HTTP endpoints backed by server memory storage, keeping the Yjs document ultra-small and sync times fast.
- **Skipped / Deferred**:
  - **Physics Engine (Matter.js)**: Skipped to prioritize rock-solid MVP collaboration, smooth viewport culling performance, and 100+ object stability.
  - **Live Waveform Visualization**: Skipped per MVP simplification to focus on robust audio recording and native HTML audio playback cards.
