# Boundless — Real-Time Collaborative Infinite Canvas 🚀

**Live Production URL:** [https://boundless-4zml.onrender.com](https://boundless-4zml.onrender.com)  
**GitHub Repository:** [https://github.com/AhmadCM01/Boundless](https://github.com/AhmadCM01/Boundless)

---

## 🌟 Overview
**Boundless** is a high-performance, real-time collaborative 2D infinite canvas application built for creative teams. Multiple users can join a room via link or code, interact live with vector shapes, sticky notes, formatted text, uploaded images, and proximity-aware voice notes, and enjoy client-authoritative physics interactions and time travel session replays.

---

## ⚡ Core Features & Status Matrix

| Feature Subsystem | Status | Technical Implementation |
| :--- | :---: | :--- |
| **Real-Time CRDT Sync** | ✅ PASS | Yjs `Y.Doc` over WebSockets (`y-websocket`) for conflict-free state merge |
| **Viewport Culling** | ✅ PASS | Bounding box spatial culling rendering 100+ loaded objects at 60 FPS |
| **6 Canvas Object Types** | ✅ PASS | Text, Shapes (Rect, Circle, Star, Triangle, Line, Arrow), Images, Sticky Notes, Voice Notes |
| **Spatial Proximity Audio** | ✅ PASS | Web Audio API `GainNode` scaling volume smoothly between $300\text{px}$ and $1500\text{px}$ |
| **Theme-Independent Colors** | ✅ PASS | 18 curated swatches + native hex color picker, 100% decoupled from UI chrome themes |
| **Mini-map Radar** | ✅ PASS | Live bi-directional rendering of online collaborators' viewports & cursor presence |
| **Offline Resilience** | ✅ PASS | `y-indexeddb` local mutation caching & zero-duplicate resync on network return |
| **Multi-Format Export** | ✅ PASS | High-resolution PNG image, vector SVG, and raw JSON document exports |
| **Session Time Travel** | ✅ PASS | Timestamped binary update delta history capture & interactive scrubber replay |
| **Client-Authoritative Physics**| ✅ PASS | Flick/throw momentum, spatial hash collisions ($O(n)$ grid), and mobile FPS cap |
| **Reactions & Follow Mode** | ✅ PASS | Floating live emoji particles & camera view locking to collaborator viewports |
| **Guest Logout** | ✅ PASS | Clean session clearance returning to onboarding without room disruption |

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Konva.js (`react-konva`), Lucide Icons.
- **Real-Time Sync**: Yjs (`yjs`), `y-websocket`, `y-indexeddb`.
- **Backend**: Node.js, TypeScript, Fastify, `ws` (WebSocket Server).
- **Deployment**: Render Web Service (Single-service Node environment).

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (Client Vite + Server Fastify)
npm run dev

# 3. Open browser
http://localhost:5173
```

---

## 🌐 Deploying to Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository (`https://github.com/AhmadCM01/Boundless`).
3. Set configuration:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Deploy! Live URL format: `https://<service-name>.onrender.com`.

> **Note on Render Free Tier**: Render free instance sleeps after 15 minutes of inactivity. First request takes 30-60s to wake up. Open the URL a few minutes before demoing to keep it warm.
