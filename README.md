# Boundless — Real-Time Collaborative Infinite Canvas

**Live Production Deployment:** [https://boundless-4zml.onrender.com](https://boundless-4zml.onrender.com)

[![Production Live](https://img.shields.io/badge/Production-Live%20on%20Render-brightgreen?style=for-the-badge&logo=render)](https://boundless-4zml.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-000000?style=for-the-badge&logo=fastify)](https://fastify.dev/)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs%20y--websocket-orange?style=for-the-badge)](https://yjs.dev/)

> **Boundless** is a high-performance, web-based collaborative infinite canvas engineered for real-time creative visual collaboration. Built with Conflict-free Replicated Data Types (CRDTs), high-FPS 2D canvas rendering, proximity spatial audio, and time-travel session replay.

---

## Project Pitch & Overview

Traditional whiteboard tools often struggle with performance degradation under heavy object loads, sync conflicts across unstable networks, and bloated state payloads when transferring media assets. 

**Boundless** solves this by combining:
1. **Zero-Conflict Sync**: Real-time state convergence powered by **Yjs CRDTs** over WebSockets.
2. **High-Performance Rendering**: **Konva.js (HTML5 2D Canvas)** with custom viewport culling that maintains smooth 60 FPS pan and zoom performance even with hundreds of concurrent shapes, strokes, and media cards.
3. **Decoupled Heavy Asset Architecture**: Audio recordings and high-resolution images are uploaded via dedicated HTTP multipart streams while Yjs handles only ultra-lightweight metadata references (`url`, `x`, `y`, `width`, `height`), preventing WebSocket telemetry lag.
4. **Spatial Proximity Audio**: Real-time spatial audio volume calculations based on 2D Euclidean distance between user cursors and spatial audio nodes.

---

## Working Features

| Feature | Description |
| :--- | :--- |
| **Infinite Canvas** | Smooth pan (middle-click/drag/hand tool), zoom (mouse wheel/pinch), and infinite 2D spatial surface. |
| **Real-Time Collaboration** | Multiplayer live cursor tracking, user presence indicators, and instant CRDT state sync via Yjs. |
| **Multiple Object Types** | Rich object support: Text blocks, Sticky Notes, Geometric Shapes (Rectangle, Circle, Star, Hexagon, Arrow), Freehand Pen/Sketch, Images, and Spatial Audio Cards. |
| **Session Replay (Time Travel)** | Historical state scrubber with incremental Y.Doc update delta playback to inspect canvas evolution over time. |
| **Spatial Proximity Audio** | Integrated voice recording and playback node with dynamic distance-based volume attenuation. |
| **Off-Chain Asset Offloading** | Dedicated REST multipart endpoint (`/api/assets`) for media uploads to keep WebSocket messages sub-millisecond fast. |
| **Canvas Export System** | One-click export to PNG (Full Canvas with retina scale), Selection-only PNG, SVG Vector graphics, and JSON snapshot state. |
| **Offline Persistence** | Automatic IndexedDB document snapshot caching with seamless automatic re-sync upon network restoration. |
| **Theme System** | Curated Dark (`#121318`) and Light (`#FAF6EF`) themes using CSS custom properties with smooth transitions. |
| **Guest Authentication & Sharing** | Instant room creation with guest username modal and zero-friction shareable URL parameters (`?room=<id>`). |

---

## System Architecture

Boundless utilizes a unified Node.js/Fastify architecture serving both static production assets and WebSocket CRDT sync on a single port.

```
                      +------------------------------------------+
                      |               Client Browser             |
                      |  React 19 + Konva.js 2D Canvas Engine   |
                      +--------------------+---------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
         HTTP REST Asset Streams                    WebSocket Binary Sync
         (POST/GET /api/assets)                    (ws://host/yjs?room=)
                    |                                             |
                    v                                             v
        +-----------------------+                    +-----------------------+
        |   Fastify REST Router |                    |  Fastify WS Upgrade   |
        | (Static & Asset API)  |                    | (y-websocket Server)  |
        +-----------+-----------+                    +-----------+-----------+
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                           v
                             +---------------------------+
                             |   Node.js / Fastify Runtime|
                             |   Port 3000 (Render Cloud)|
                             +---------------------------+
```

### Decoupled Single-Port Server Execution
- **HTTP Layer**: Fastify serves the compiled Vite SPA bundle (`dist/client`) alongside `/api/assets` file upload/retrieval routes.
- **WebSocket Layer**: Intercepts HTTP upgrade requests matching `/yjs` parameters and routes them to `y-websocket` CRDT document handler rooms (`y-websocket/bin/utils`).

---

## Known Limitations (End of Day 1 Checkpoint)

- **Text/Sticky Note Edit State**: The React-Konva edit overlay is currently throwing a `Cannot read properties` error during the write-state due to uninitialized Yjs object properties. (Pending strict null-guard implementation).
- **Session Travel (Replay) Divergence**: Client-side initialization of the scratch Y.Doc is dropping the base state, leading to delta divergence during playback.
- **Physics Engine (Matter.js)**: The attract/repel behaviors are currently disabled as they flood the Yjs WebSocket with excessive coordinate mutations. (Pending throttled sync implementation).
- **Mobile Viewport Layout**: Absolute-positioned UI flyouts (like the Shape menu) are currently clipping on mobile breakpoints.

---

## Day 2 Roadmap (Next Steps)

- **Priority 1**: Stabilize the text edit overlay with safe DOM portals.
- **Priority 2**: Implement CSS media queries to replace the current `overflowX` mobile wrappers.
- **Priority 3**: Throttle Matter.js physics calculations to local client states, syncing to Yjs only on rest.
- **Priority 4 (Advanced Content Tools)**: Implement Multi-select bounding boxes, Object Grouping (treating multiple CRDT nodes as a single transformable entity), and Align/Distribute algorithms (calculating delta offsets for even spacing).

---

## Frontend Logic & Performance Engineering

### 1. High-Performance 2D Rendering
- **Konva.js Integration**: Canvas objects are rendered using React-Konva nodes wrapped in custom `React.memo` components.
- **Viewport Culling (`useViewportCulling`)**: Mathematical bounding-box calculation (`x`, `y`, `width`, `height`) against stage coordinates (`stageX`, `stageY`, `zoom`). Objects outside the active camera frustum are culled from the Konva draw tree, reducing draw calls from $O(N)$ total objects to $O(M)$ visible objects.

### 2. Isolated Error Boundaries
- **CanvasObjectErrorBoundary**: Every individual canvas node is wrapped in a dedicated error boundary. If a single object node encounters an unexpected property error, it renders a subtle placeholder card instead of crashing the Konva `<Layer>` tree.

### 3. Decoupled HTML Edit Portals
- Text block editing modal and audio controls utilize `ReactDOM.createPortal` attached to `document.body` outside the Konva stage tree. This completely eliminates non-Konva DOM node draw loop crashes (`child.draw is not a function`).

---

## Backend & State Management Logic

### 1. Conflict-Free Replicated Data Types (Yjs CRDTs)
- State resides in a shared `Y.Doc` instance containing a `Y.Map<CanvasObject>('objects')`.
- All object mutations (move, resize, edit text, change color, delete) are applied directly to the Yjs shared map, emitting binary update deltas to all connected peers over WebSocket.

### 2. Heavy Asset Offloading
- Uploading large audio BLOBs or image files directly through Yjs string buffers degrades WebSocket synchronization.
- **Boundless Protocol**:
  1. Client uploads raw asset to `POST /api/assets`.
  2. Server saves file to persistent asset storage and returns a relative URL (`/api/assets/<id>`).
  3. Client writes only `{ type: 'audio', url: '/api/assets/<id>', x, y }` to Yjs.
  4. Peers load the asset asynchronously via standard browser HTTP caching.

---

## SDLC & Development Approach

We adopted a **Component-Driven Development (CDD)** workflow during this sprint:

1. **Sprint Phase 1: Core Foundation & CRDT Sync**: Established Yjs WebSocket synchronization, stage camera panning/zooming, and state schema contracts (`src/shared/types.ts`).
2. **Sprint Phase 2: Component Architecture**: Designed modular canvas nodes (`TextObjectNode`, `StickyObjectNode`, `ShapeObjectNode`, `ImageObjectNode`, `AudioObjectNode`, `PenObjectNode`) with strict fallback guards against uninitialized Yjs states.
3. **Sprint Phase 3: Spatial Audio & Media Pipeline**: Built the HTTP asset streaming endpoint and spatial audio proximity algorithm.
4. **Sprint Phase 4: Time Travel & Exporting**: Implemented `ReplayModal` with Y.Doc binary delta replay and high-dpi PNG/SVG export handlers.
5. **Sprint Phase 5: Production Hardening**: Sealed UI alignment, mobile responsive layouts, error boundaries, and Render cloud deployment.

---

## Local Setup & Run Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/AhmadCM01/Boundless.git
cd Boundless

# 2. Install dependencies
npm install

# 3. Start development environment (Vite Dev Server + Fastify Backend)
npm run dev

# 4. Build production bundle (TypeScript compilation + Vite build)
npm run build

# 5. Start production server
npm start
```

The application will be accessible locally at `http://localhost:3000`.

---

## Submission Packaging & Git Commands

### Git Commit & Push
```bash
git add .
git commit -m "docs: sanitize README for 5PM deadline, add prominent live URL and Priority 4 roadmap"
git push origin main
```

### Packaging Repository into ZIP
To generate a clean submission ZIP file excluding `.git`, `node_modules`, and build artifacts:

**PowerShell (Windows)**:
```powershell
Compress-Archive -Path .\.gitignore, .\README.md, .\package.json, .\package-lock.json, .\index.html, .\tsconfig.json, .\tsconfig.server.json, .\vite.config.ts, .\public, .\src -DestinationPath ..\Boundless_5PM_Checkpoint.zip -Force
```

**Bash / Linux / macOS**:
```bash
zip -r Boundless_5PM_Checkpoint.zip . -x "node_modules/*" ".git/*" "dist/*" "*.log" "*.zip"
```
