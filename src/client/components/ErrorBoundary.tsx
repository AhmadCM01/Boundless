import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Boundless App Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#121318',
          color: '#f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: '100%',
          }}>
            <h2 style={{ fontSize: 20, color: '#ef4444', marginBottom: 12 }}>Application Encountered an Error</h2>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>
              {this.state.error?.message || 'An unexpected error occurred during rendering.'}
            </p>
            {this.state.error?.stack && (
              <pre style={{
                textAlign: 'left',
                background: '#000',
                padding: 12,
                borderRadius: 8,
                fontSize: 11,
                overflowX: 'auto',
                maxHeight: 200,
                color: '#fca5a5',
                marginBottom: 20,
              }}>
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#3f3f46',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload Boundless
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
