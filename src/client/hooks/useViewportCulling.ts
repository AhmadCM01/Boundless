import { useMemo } from 'react';
import { CanvasObject } from '../../shared/types';

interface ViewportCullingParams {
  canvasObjects: Map<string, CanvasObject>;
  stageX: number;
  stageY: number;
  zoom: number;
  windowWidth: number;
  windowHeight: number;
  bufferMargin?: number;
}

export function useViewportCulling({
  canvasObjects,
  stageX,
  stageY,
  zoom,
  windowWidth,
  windowHeight,
  bufferMargin = 250,
}: ViewportCullingParams): CanvasObject[] {
  return useMemo(() => {
    if (canvasObjects.size === 0) return [];

    // Calculate visible bounding box in world canvas coordinates
    const minX = (0 - stageX) / zoom - bufferMargin;
    const maxX = (windowWidth - stageX) / zoom + bufferMargin;
    const minY = (0 - stageY) / zoom - bufferMargin;
    const maxY = (windowHeight - stageY) / zoom + bufferMargin;

    const visible: CanvasObject[] = [];

    canvasObjects.forEach((obj) => {
      // Calculate object bounding box (handling circle radius or standard width/height)
      const objWidth = obj.width || 100;
      const objHeight = obj.height || 100;

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
  }, [canvasObjects, stageX, stageY, zoom, windowWidth, windowHeight, bufferMargin]);
}
