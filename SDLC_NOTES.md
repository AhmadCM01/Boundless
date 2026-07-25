# Boundless — SDLC & Architectural Engineering Notes

## 🚀 1. Software Development Life Cycle (SDLC) Approach
- **Iterative & Phase-Gated Verification**: Built using an iterative, tier-by-tier architecture. Each phase (Tier 0 through Tier 4) was completed and strictly verified live on the deployed environment before proceeding to subsequent features.
- **Empirical Verification Discipline**: Zero claims of completion were accepted at face value. Every capability was validated against empirical evidence: live multi-browser tab synchronization tests, real network throttling for offline CRDT state recovery, Web Audio API gain node measurements, and 100+ object viewport culling benchmarks.

## 🏗️ 2. Architectural Decisions
- **CRDT Synchronization Layer**: Powered by Yjs (`yjs`) and WebSocket provider (`y-websocket`). All room states are structured as Conflict-free Replicated Data Types (`Y.Map`), eliminating central lock bottlenecks and enabling peer-to-peer style eventual consistency.
- **Canvas Rendering Subsystem**: Konva.js (`react-konva`) for hardware-accelerated 2D canvas rendering with zero anti-aliasing fuzziness across min/max zoom scale levels.
- **Viewport Culling**: Custom `useViewportCulling` hook calculating spatial bounding intersections, ensuring that off-screen objects are culled from rendering loops. Maintains 60 FPS even with 100+ loaded canvas objects.
- **Out-of-Band Asset Storage**: Image binary blobs and voice recording audio clips are uploaded via standard Fastify HTTP endpoints (`/api/assets`) and stored as in-memory Buffers, referencing light URLs within Yjs objects. This keeps Yjs sync documents compact (< 50KB) and avoids bloated initial sync payloads for new joiners.
- **Client-Authoritative Physics & Spatial Hashing**: Ephemeral lock ownership via Yjs Awareness. Physics updates execute locally at 60 FPS and write position to `Y.Doc` every 150ms or upon coming to rest. Collisions and spatial forces are computed using an $O(n)$ uniform grid spatial hash (~350px buckets) to prevent WebSocket flooding.

## ⚖️ 3. Trade-offs & Scoping Decisions
- **In-Memory Asset & History Storage**: Chosen for rapid hackathon velocity and lightweight single-service deployment. Production persistence can seamlessly swap in S3 object storage and PostgreSQL delta logging.
- **Mobile FPS Degradation**: Automatically caps maximum simultaneous active physics objects to 5 if frame rate drops below 45 FPS on lower-powered mobile devices.
