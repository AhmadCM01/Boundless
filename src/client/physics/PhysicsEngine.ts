import Matter from 'matter-js';
import { CanvasObject, ShapeObject } from '../../shared/types';

export interface PhysicsStateUpdate {
  id: string;
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  isResting: boolean;
}

export class PhysicsEngine {
  private engine: Matter.Engine;
  private bodiesMap: Map<string, Matter.Body> = new Map();
  private activeThrows: Set<string> = new Set();
  private enabled: boolean = false;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    });
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
    this.clear();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public throwObject(id: string, vx: number, vy: number): void {
    let body = this.bodiesMap.get(id);
    if (body) {
      this.activeThrows.add(id);
      Matter.Body.setStatic(body, false);
      Matter.Body.setVelocity(body, { x: vx, y: vy });
    }
  }

  public impulseAllObjects(): void {
    this.bodiesMap.forEach((body, id) => {
      this.activeThrows.add(id);
      Matter.Body.setStatic(body, false);
      const vx = (Math.random() - 0.5) * 12;
      const vy = (Math.random() - 0.5) * 12;
      Matter.Body.setVelocity(body, { x: vx, y: vy });
    });
  }

  public syncObjects(objects: Map<string, CanvasObject>, currentUserId: string): void {
    if (!this.enabled) return;

    const currentIds = new Set(objects.keys());

    // 1. Remove dead bodies
    this.bodiesMap.forEach((body, id) => {
      if (!currentIds.has(id)) {
        Matter.Composite.remove(this.engine.world, body);
        this.bodiesMap.delete(id);
        this.activeThrows.delete(id);
      }
    });

    // 2. Add or update active bodies
    objects.forEach((obj, id) => {
      let body = this.bodiesMap.get(id);
      const w = Math.max(30, obj.width || 100);
      const h = Math.max(30, obj.height || 100);
      const centerX = obj.x + w / 2;
      const centerY = obj.y + h / 2;

      const isOwned = !obj.physicsOwner || obj.physicsOwner === currentUserId;
      const isCircle = obj.type === 'shape' && (obj as ShapeObject).shapeType === 'circle';

      if (!body) {
        body = isCircle
          ? Matter.Bodies.circle(centerX, centerY, w / 2, { frictionAir: 0.02, restitution: 0.85, density: 0.001 })
          : Matter.Bodies.rectangle(centerX, centerY, w, h, { frictionAir: 0.02, restitution: 0.85, density: 0.001 });
        (body as any).canvasId = id;
        Matter.Composite.add(this.engine.world, body);
        this.bodiesMap.set(id, body);
      }

      // CRDT Ownership Guard: Active thrown objects must NOT be overridden by sync
      if (this.activeThrows.has(id)) {
        Matter.Body.setStatic(body, false);
      } else if (!isOwned || obj.isKinematic) {
        Matter.Body.setStatic(body, true);
        Matter.Body.setPosition(body, { x: centerX, y: centerY });
        if (obj.rotation !== undefined) {
          Matter.Body.setAngle(body, (obj.rotation * Math.PI) / 180);
        }
      }
    });
  }

  public stepSimulation(
    objects: Map<string, CanvasObject>,
    currentUserId: string
  ): PhysicsStateUpdate[] {
    if (!this.enabled || this.bodiesMap.size === 0) return [];

    // Advance Matter.js physics step
    Matter.Engine.update(this.engine, 1000 / 60);

    const updates: PhysicsStateUpdate[] = [];

    this.bodiesMap.forEach((body, id) => {
      if (body.isStatic) return;

      const obj = objects.get(id);
      if (!obj) return;

      const w = obj.width || 100;
      const h = obj.height || 100;
      const topLeftX = body.position.x - w / 2;
      const topLeftY = body.position.y - h / 2;
      const rotationDeg = Math.round((body.angle * 180) / Math.PI);

      const vx = body.velocity.x;
      const vy = body.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);

      // Object is active if it has speed or was thrown
      if (speed > 0.02 || this.activeThrows.has(id)) {
        const isResting = speed < 0.05;
        if (isResting) {
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
          this.activeThrows.delete(id);
        }

        updates.push({
          id,
          x: Math.round(topLeftX),
          y: Math.round(topLeftY),
          rotation: rotationDeg,
          vx,
          vy,
          isResting,
        });
      }
    });

    return updates;
  }

  public clear(): void {
    Matter.Composite.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
    this.bodiesMap.clear();
    this.activeThrows.clear();
  }
}

export const physicsEngine = new PhysicsEngine();
