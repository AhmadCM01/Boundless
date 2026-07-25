import { CanvasObject } from '../../shared/types';

export const ENABLE_PHYSICS = true;

export interface PhysicsObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isResting: boolean;
  lastUpdated: number;
}

export class PhysicsEngine {
  private activeObjects: Map<string, PhysicsObject> = new Map();
  private spatialHash: Map<string, string[]> = new Map();
  private bucketSize = 350; // Spatial hash cell dimension in canvas coordinates

  // Step 1: Initialize throw momentum on drag release
  public throwObject(obj: CanvasObject, vx: number, vy: number): void {
    if (!ENABLE_PHYSICS) return;
    this.activeObjects.set(obj.id, {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      width: obj.width || 100,
      height: obj.height || 100,
      vx,
      vy,
      isResting: false,
      lastUpdated: Date.now(),
    });
  }

  // Step 2 & 3: Run 60 FPS physics tick for active objects only
  public stepSimulation(
    canvasObjects: Map<string, CanvasObject>,
    onUpdatePosition: (id: string, x: number, y: number) => void,
    fps: number = 60
  ): void {
    if (!ENABLE_PHYSICS || this.activeObjects.size === 0) return;

    // Mobile Degradation: Cap active objects to max 5 if FPS < 45
    const maxActive = fps < 45 ? 5 : 20;

    // Rebuild spatial hash grid for active objects
    this.spatialHash.clear();
    let count = 0;

    this.activeObjects.forEach((pObj, id) => {
      if (count >= maxActive) return;
      count++;

      // Apply friction damping
      pObj.vx *= 0.95;
      pObj.vy *= 0.95;

      pObj.x += pObj.vx;
      pObj.y += pObj.vy;

      // Check resting threshold
      if (Math.abs(pObj.vx) < 0.1 && Math.abs(pObj.vy) < 0.1) {
        pObj.vx = 0;
        pObj.vy = 0;
        pObj.isResting = true;
      }

      // Add to spatial hash grid
      const key = `${Math.floor(pObj.x / this.bucketSize)}_${Math.floor(pObj.y / this.bucketSize)}`;
      let bucket = this.spatialHash.get(key);
      if (!bucket) {
        bucket = [];
        this.spatialHash.set(key, bucket);
      }
      bucket.push(id);

      // Throttled position update callback (every 150ms or when resting)
      const now = Date.now();
      if (now - pObj.lastUpdated >= 150 || pObj.isResting) {
        pObj.lastUpdated = now;
        onUpdatePosition(pObj.id, pObj.x, pObj.y);
      }
    });

    // Step 2: Handle Spatial Collisions between objects in same/adjacent buckets
    this.spatialHash.forEach((ids) => {
      if (ids.length < 2) return;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = this.activeObjects.get(ids[i]);
          const b = this.activeObjects.get(ids[j]);
          if (a && b) {
            this.resolveCollision(a, b);
          }
        }
      }
    });

    // Remove resting objects
    this.activeObjects.forEach((pObj, id) => {
      if (pObj.isResting) {
        this.activeObjects.delete(id);
      }
    });
  }

  // Elastic collision response
  private resolveCollision(a: PhysicsObject, b: PhysicsObject): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = (a.width + b.width) / 2;

    if (dist > 0 && dist < minDist) {
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      // Bounce velocity swap
      const tempVx = a.vx;
      const tempVy = a.vy;
      a.vx = b.vx * 0.8 - nx * overlap * 0.1;
      a.vy = b.vy * 0.8 - ny * overlap * 0.1;
      b.vx = tempVx * 0.8 + nx * overlap * 0.1;
      b.vy = tempVy * 0.8 + ny * overlap * 0.1;

      a.isResting = false;
      b.isResting = false;
    }
  }

  public getActiveCount(): number {
    return this.activeObjects.size;
  }
}

export const physicsEngine = new PhysicsEngine();
