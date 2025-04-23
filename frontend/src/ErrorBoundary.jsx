// src/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can also log this to an external service
    console.error('Uncaught render error:', error, info);
  }

  handleGoBack = () => {
    // Take the user back one step in history:
    window.history.back();
    // Reset the error boundary so they can try again:
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h1>😞 Oops—something went wrong.</h1>
          {/* <p>{this.state.error?.message || 'Unknown error.'}</p> */}
          <button classNAme = "save-btn1" onClick={this.handleGoBack}>Go Back</button>
        </div>
      );
    }

    return this.props.children;
  }
}
