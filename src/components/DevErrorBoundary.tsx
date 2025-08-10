import React, { type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export default class DevErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // window.location.reload(); // Uncomment if a full reload is preferred
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-3 text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm opacity-80">
              An unexpected error occurred. Check the console for details.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-md border"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
