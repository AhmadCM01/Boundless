export type ObjectType = 'text' | 'shape' | 'sticky' | 'image' | 'audio';

export interface BaseCanvasObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface TextObject extends BaseCanvasObject {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface ShapeObject extends BaseCanvasObject {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'star' | 'triangle' | 'line' | 'arrow';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface StickyObject extends BaseCanvasObject {
  type: 'sticky';
  text: string;
  color: string;
  author: string;
}

export interface ImageObject extends BaseCanvasObject {
  type: 'image';
  assetId: string;
  src: string;
  aspectRatio: number;
}

export interface AudioObject extends BaseCanvasObject {
  type: 'audio';
  assetId: string;
  audioUrl: string;
  duration: number;
  title: string;
}

export type CanvasObject = TextObject | ShapeObject | StickyObject | ImageObject | AudioObject;

export interface CursorPosition {
  x: number;
  y: number;
}

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface UserAwareness {
  userId: string;
  username: string;
  color: string;
  cursor?: CursorPosition;
  viewport?: ViewportBounds;
  selectedId?: string | null;
  lastSeen?: number;
}
