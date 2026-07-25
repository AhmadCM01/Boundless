import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Group, Rect, Text } from 'react-konva';

interface Props {
  children: ReactNode;
  objectId?: string;
  x?: number;
  y?: number;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Isolated Error Boundary for Konva Canvas Objects.
 * Prevents a rendering crash in any single object node from unmounting or blanking the entire canvas.
 */
export class CanvasObjectErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Render error',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`💥 [CanvasObjectErrorBoundary] Crashed rendering object (${this.props.objectId}):`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const posX = this.props.x || 0;
      const posY = this.props.y || 0;

      // Render a safe Konva fallback placeholder group
      return (
        <Group x={posX} y={posY}>
          <Rect
            width={160}
            height={60}
            fill="#7f1d1d"
            stroke="#ef4444"
            strokeWidth={1.5}
            cornerRadius={8}
          />
          <Text
            x={10}
            y={12}
            text="⚠️ Object Error"
            fontSize={12}
            fontStyle="bold"
            fontFamily="Inter"
            fill="#fca5a5"
          />
          <Text
            x={10}
            y={32}
            text={this.state.errorMessage.substring(0, 22)}
            fontSize={10}
            fontFamily="Inter"
            fill="#f87171"
          />
        </Group>
      );
    }

    return this.props.children;
  }
}
