import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log the error to console for developer visibility
    console.error('Unhandled render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Roboto, Arial, sans-serif' }}>
          <h2 style={{ color: '#b91c1c' }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff4f4', padding: 12, borderRadius: 6 }}>{String(this.state.error)}</pre>
          <p>Please check the developer console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
