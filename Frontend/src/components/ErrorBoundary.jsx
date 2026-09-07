import { Component } from "react";

// A production app must never show a blank white screen when a
// component throws — this catches any rendering error anywhere below
// it in the tree and shows a minimal, on-brand fallback instead of a
// crash. Uses the same tokens as the rest of the site rather than a
// new visual style.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In a real deployment this is where you'd forward to an error
    // tracking service (Sentry, etc.) — logging is the safe minimum.
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="payment-callback-page">
          <div className="payment-callback-card">
            <h1 className="payment-status-failed">Something went wrong</h1>
            <p>
              This part of the page hit an unexpected error. Try reloading —
              if it keeps happening, please let us know.
            </p>
            <button onClick={() => window.location.assign("/")}>
              Return to marketplace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
