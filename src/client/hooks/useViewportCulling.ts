import { useMemo } from 'react';
import { CanvasObject } from '../../shared/types';

interface ViewportCullingParams {
  canvasObjects?: Map<string, CanvasObject>;
  objects?: Map<string, CanvasObject>;
  stageX: number;
  stageY: number;
  zoom: number;
  windowWidth?: number;
  windowHeight?: number;
  screenWidth?: number;
  screenHeight?: number;
  bufferMargin?: number;
}

export function useViewportCulling(params: ViewportCullingParams): CanvasObject[] {
  const targetMap = params.canvasObjects || params.objects;
  const stageX = params.stageX || 0;
  const stageY = params.stageY || 0;
  const zoom = params.zoom || 1;
  const width = params.windowWidth || params.screenWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const height = params.windowHeight || params.screenHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const bufferMargin = params.bufferMargin ?? 250;

  return useMemo(() => {
    if (!targetMap || typeof targetMap.size !== 'number' || targetMap.size === 0) {
      return [];
    }

    // Calculate visible bounding box in world canvas coordinates
    const minX = (0 - stageX) / zoom - bufferMargin;
    const maxX = (width - stageX) / zoom + bufferMargin;
    const minY = (0 - stageY) / zoom - bufferMargin;
    const maxY = (height - stageY) / zoom + bufferMargin;

    const visible: CanvasObject[] = [];

    targetMap.forEach((obj) => {
      if (!obj) return;

      let objWidth = obj.width || 100;
      let objHeight = obj.height || 100;

      if (obj.type === 'pen' && (obj as any).points && (obj as any).points.length >= 2) {
        const pts = (obj as any).points as number[];
        let minPx = Infinity;
        let maxPx = -Infinity;
        let minPy = Infinity;
        let maxPy = -Infinity;
        for (let i = 0; i < pts.length; i += 2) {
          if (pts[i] < minPx) minPx = pts[i];
          if (pts[i] > maxPx) maxPx = pts[i];
          if (pts[i + 1] < minPy) minPy = pts[i + 1];
          if (pts[i + 1] > maxPy) maxPy = pts[i + 1];
        }
        objWidth = Math.max(20, maxPx - minPx + 20);
        objHeight = Math.max(20, maxPy - minPy + 20);
      }

      const objMinX = obj.x;
      const objMaxX = obj.x + objWidth;
      const objMinY = obj.y;
      const objMaxY = obj.y + objHeight;

      // Check bounding box intersection
      const isIntersecting =
        objMaxX >= minX &&
        objMinX <= maxX &&
        objMaxY >= minY &&
        objMinY <= maxY;

      if (isIntersecting) {
        visible.push(obj);
      }
    });

    // Sort by zIndex for proper layer stacking
    return visible.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [targetMap, stageX, stageY, zoom, width, height, bufferMargin]);
}
