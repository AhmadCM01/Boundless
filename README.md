# Boundless

**Real-Time Collaborative Infinite Canvas** — built for the Abuja Tech Challenge Hackathon.

---

## What is Boundless?

Boundless is a web platform where multiple people work together live on an infinite 2D canvas — not a Figma or digital-whiteboard clone, but a space designed around the idea that a shared canvas can feel alive, not just static and precise.

Anyone can spin up a room, share a link, and join as a guest. From there, everyone sees everyone else's edits instantly, can sketch, place shapes, sticky notes, images, and audio recordings, and collaborate with tools that go beyond what a typical whiteboard tool offers — physics-based object interactions, spatial audio that responds to where you are on the canvas, live reactions, and the ability to follow another collaborator's viewport in real time.

### Architecture

```
Browser Client A ─┐                                  ┌─ Browser Client B
  React + Konva    │                                  │   React + Konva
  Yjs (CRDT doc)   │                                  │   Yjs (CRDT doc)
        │          │                                  │          │
        │  WebSocket (y-websocket) ── /yjs?room=:id ──┘          │
        └──────────────────────┬───────────────────────────────┘
                                ▼
                  ┌───────────────────────────┐
                  │   Node.js + TypeScript     │
                  │   Fastify — single service │
                  │                            │
                  │  • Serves built React      │
                  │    frontend (static)       │
                  │  • Handles /yjs WebSocket  │
                  │    upgrade, room-scoped    │
                  │  • POST/GET /api/assets    │
                  │    (image/audio storage)   │
                  │  • SQLite — session replay │
                  │    history log             │
                  └───────────────────────────┘

Local persistence: y-indexeddb caches each room's document in the
browser, enabling offline edits that resync automatically on reconnect.
```

The server's job is deliberately small: relay WebSocket sync traffic, serve media assets, and log document deltas for session replay. The real complexity lives in the client, where Yjs, Konva, and the canvas interaction layer work together.

### Key Properties

| Property | Mechanism |
|---|---|
| **Conflict-free real-time sync** | Yjs CRDTs — no custom merge logic, no lost updates, correct regardless of network timing |
| **Live presence** | Yjs Awareness protocol — cursors, usernames, colors, viewports, broadcast without touching the persisted document |
| **Infinite canvas at scale** | Viewport culling — only objects within (or near) the visible viewport are rendered by Konva, keeping performance smooth with 100+ objects |
| **Offline-first** | y-indexeddb caches the document locally; edits made offline sync automatically once reconnected |
| **Lightweight sync document** | Images and audio are never stored inside the Yjs document — only a reference ID; actual bytes are served via a plain HTTP endpoint, keeping sync fast regardless of media size |
| **Zero-drift transforms** | Resize and rotate operations keep the opposite anchor corner fixed at every zoom level, with no position snap-back — see Design Decisions for how this was solved |
| **Single-service deployment** | One Node process serves both the built frontend and the WebSocket upgrade — no CORS, no second service to manage |

---

## Quick Start

### Prerequisites

- Node.js 18+
- No external database service required — session history is stored in a local SQLite file, created automatically on first run

### 1. Clone and install

```bash
git clone <repo-url>
cd boundless
npm install
```

### 2. Development

```bash
npm run dev
```

Runs the Fastify backend (port 3000) and the Vite dev server (port 5173) together.

### 3. Production build & run

```bash
npm run build   # builds client (dist/client) and server (dist/server)
npm start       # runs the single-service production server
```

### 4. Verify

Open `http://localhost:3000` (production) or `http://localhost:5173` (dev). Visiting the root URL auto-generates a room and redirects to `/room/:roomId`.

---

## Live Deployment

**Live URL:** https://boundless-4zml.onrender.com

Deployed as a single Node service on Render (free tier). Build command: `npm run build`. Start command: `npm start`. Render auto-detects `process.env.PORT`.

> **Note on cold starts:** Render's free tier sleeps the service after 15 minutes of inactivity. The first request afterward can take 30–60 seconds to wake up. If demoing live, open the URL a few minutes beforehand to keep it warm.

---

## Feature Walkthrough

### Rooms & Guest Identity
- Visiting the root URL generates a unique room and redirects to `/room/:roomId`.
- A guest join modal prompts for a username; identity and cursor color are stored for the session. Unauthenticated visitors never see the canvas, tools, or floating panels — those render only after joining.
- **Share Room** copies the exact room URL to the clipboard for inviting collaborators.
- Room history and custom room renaming are available from the dashboard/header.

### Real-Time Collaboration
- All object mutations (create, move, resize, rotate, edit, delete) sync instantly across every connected client via Yjs CRDTs — no conflict resolution logic was hand-written; Yjs guarantees convergence regardless of the order updates arrive in.
- Live cursors show every collaborator's position, name, and color.
- **Follow mode:** click a collaborator's avatar to lock your viewport to theirs in real time.
- **Live reactions:** click the canvas to send a floating emoji reaction, visible to everyone instantly — this is ephemeral (broadcast via Yjs Awareness), not a persisted canvas object.
- **Multi-selection drag:** selecting several objects and dragging keeps their relative positions locked together.
- **Grouping:** select multiple objects and group them into a persistent unit — clicking any single member reselects the whole group, and dragging moves them together. Group/ungroup assignments sync in real time across all connected clients.
- **Undo/redo:** backed by Yjs's `Y.UndoManager`, bound to `Ctrl+Z` / `Ctrl+Y` (`Cmd+Shift+Z` on Mac) and header buttons.

### Infinite Canvas
- Smooth, cursor-anchored zoom and free panning across an unbounded 2D coordinate space, with a dot-grid background that tiles seamlessly at any zoom level.
- **Viewport culling** ensures only objects within (or near) the visible area are rendered — verified to hold smooth performance with 100+ objects via a built-in benchmark tool (tucked in the toolbar's overflow menu) that spawns 100 randomly placed objects for stress-testing.

### Object Types
| Type | Notes |
|---|---|
| Text | Editable inline, font size/color customization |
| Shapes | Rectangle, ellipse, triangle, star, line, arrow — via a single flyout tool, not one button per shape |
| Sticky notes | Color-coded, author-attributed, with editable font size, bold/italic, alignment, and color |
| Freehand pen | Smooth sketch strokes for hand-drawn annotation directly on the canvas |
| Images | Uploaded via `/api/assets`, referenced by ID, not embedded in the sync document |
| Audio recordings | Recorded in-browser via the MediaRecorder API, uploaded via `/api/assets`, played back with **proximity spatial audio** — volume rises as your viewport approaches the recording's position on the canvas and fades as you move away, using the Web Audio API's `GainNode` |

All object types share a common color-picker system so users can style their own content freely, independent of the app's UI theme.

### High-Score Features
- **Physics:** objects can be thrown, collide, and interact with momentum, via Matter.js. See Design Decisions below for how physics authority and network sync are handled across multiple clients.
- **Mini-map / Radar:** a live overlay showing every object's position and every collaborator's current viewport, sourced from the same Awareness data used for cursors.
- **Offline support:** `y-indexeddb` caches the room's document locally; edits made while offline are queued and automatically synced once the connection is restored, with no manual resolution needed.

### Bonus Features
- **Export:** full canvas or selection-only export to PNG, plus SVG (vector) and JSON (raw structured document) formats.
- **Time Travel:** a session replay mode reconstructed from a server-side log of document deltas (SQLite-backed), with adaptive viewport framing so the replay follows where activity happened.

### Design System
- Full light/dark theme via a CSS custom-property token system, toggled from the header and persisted across sessions.
- Light mode uses warm cream tones rather than stark white; dark mode uses deep neutral charcoal rather than pure black.
- A single, consistent floating-UI container language (glassmorphism panels) is used across the toolbar, contextual selection controls, reactions dock, and minimap.
- The brand mark is a four-color infinite loop (yellow, red, mint green, orange) — the only place these colors appear; all functional UI uses a neutral accent, so the mark reads as a deliberate moment rather than blending into general chrome.

---

## Manual Verification Checklist

1. **Real-time sync:** open the same room in two tabs, add an object in one, confirm it appears instantly in the other.
2. **100+ object performance:** use the benchmark tool to spawn 100 objects, confirm pan/zoom stays smooth.
3. **Zero-drift transform:** resize an object from each corner handle, then rotate it — confirm the opposite anchor corner never shifts and the object doesn't snap to a different size after release.
4. **Audio + spatial volume:** record an audio note, confirm it uploads and plays back; pan away from it and confirm volume fades; pan back and confirm it rises again.
5. **Physics:** enable physics mode, throw an object, confirm it moves with momentum and settles naturally; confirm a second connected client sees smooth movement (not stuttering) even though only the throwing client is computing full physics.
6. **Offline resync:** disable network in DevTools, make edits, reconnect, confirm changes sync without conflict.
7. **Fresh onboarding:** open the room URL in a private/incognito window with no prior state, confirm guest join works cleanly.
8. **Responsive layout:** open on a real mobile device, confirm the toolbar and floating panels remain usable rather than overflowing.
9. **Follow mode & reactions:** from a second client, click a collaborator's avatar to follow their viewport; click the canvas to send a live reaction.
10. **Grouping:** select multiple objects, group them, deselect, click just one member, confirm the whole group reselects and drags together; ungroup and confirm objects become independently selectable again.

---

## Design Decisions

### Yjs over hand-rolled sync logic
Building custom conflict resolution for a multi-user canvas is a genuinely hard, easy-to-get-subtly-wrong problem. Yjs is a battle-tested CRDT implementation already used in production collaborative tools, and it comes with the Awareness protocol (presence/cursors) and offline persistence (`y-indexeddb`) built in — both of which map directly onto requirements in the brief, rather than needing to be built from scratch.

### Media assets never stored in the Yjs document
Images and audio are referenced by ID inside the sync document, with the actual bytes served over a plain HTTP endpoint. Embedding binary data (even base64-encoded) directly in a CRDT document means every client, including new joiners, has to transfer that full payload just to open the room. Keeping the document itself small and fast to sync was prioritized over convenience.

### Zero-drift resize and rotate
Konva's `<Transformer>` scales a node visually by mutating its `scaleX`/`scaleY` in place during a drag. If that scale is reset back to `1.0` imperatively, in the same tick as the transform ends, there's a window where the node's visual scale has already reset but the component hasn't yet re-rendered with the newly calculated width — producing a visible flash back to the old size before snapping to the correct one. The fix: the scale reset is deferred into a `useEffect` keyed on the object's width/height/position/rotation props, so it only fires once React has actually rendered the new dimensions from Yjs — eliminating the mismatch window entirely, at every zoom level and from every resize handle.

### Physics: single-writer authority with interpolated remote updates
Running a full physics simulation independently on every connected client would cause each client's Matter.js world to drift out of sync with the others (physics engines aren't deterministic across independent runs). Instead, only the client who threw/last interacted with an object (`physicsOwner`) computes its physics locally at 60fps; that client broadcasts position updates to Yjs at a throttled 15Hz rather than every frame, and remote clients interpolate (lerp) between received positions rather than running their own simulation for that object. This keeps physics visually smooth for everyone while avoiding both simulation drift and flooding the sync channel with 60fps updates.

### Throttled physics sync generally
This is the same principle applied project-wide: continuous, high-frequency interactions (physics, drag) are never synced at full frame rate — position snapshots are throttled and interpolated on the receiving end, so real-time collaboration performance stays smooth regardless of how much simultaneous physics or motion is happening.

### Single-service deployment
Serving the built frontend and the WebSocket upgrade from one Node process avoids CORS entirely and keeps the deployment surface small — one service to build, one to deploy, one URL to share.

---

## Known Limitations & Trade-offs

- **Free-tier hosting cold starts:** the live Render deployment sleeps after 15 minutes of inactivity; the first request afterward is slow to respond.
- **Session history vs. live room state:** session replay history is persisted server-side via SQLite, but live in-progress room state itself is held in server memory and each client's local IndexedDB cache, not in a long-term database. A full server restart with no connected clients would lose in-progress state beyond what the replay log and connected clients' local caches retain.
- **High physics load on lower-end hardware:** physics performance is smooth up to roughly 100–250 simultaneously active physics bodies on typical desktop hardware; well beyond that, particularly on lower-tier mobile devices, frame rate can degrade. This wasn't a practical concern for the demo scale this was built and tested at.
- **Concurrent user scale is untested beyond small-group demos.** The architecture (Yjs + WebSocket relay, throttled physics broadcast) is designed to scale, but load testing at high concurrent room populations was out of scope given the build timeline.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Real-time sync | Yjs (CRDT) + y-websocket |
| Canvas rendering | Konva.js via react-konva |
| Physics | Matter.js |
| Backend | Node.js + TypeScript + Fastify |
| Session history | SQLite |
| Offline persistence | y-indexeddb |
| Deployment | Render (single service) |
