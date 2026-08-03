import React from 'react'

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14, color: '#e74c3c', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#333' }}>渲染错误</h2>
          <pre>{this.state.error?.message}</pre>
          <pre style={{ marginTop: 20, fontSize: 12, color: '#666' }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
