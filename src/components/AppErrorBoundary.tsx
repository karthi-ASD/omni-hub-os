import React from "react";
import { logDialerEvent } from "@/hooks/useBrowserDialer";

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * Global error boundary for the authenticated app shell.
 * Prevents blank screens by catching render errors and showing
 * a visible fallback instead of a white screen.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const componentStack = info.componentStack ?? "unknown";
    console.error("[AppErrorBoundary] Render error caught:", error, componentStack);
    try {
      logDialerEvent("ERROR_BOUNDARY_TRIGGERED", {
        message: error.message,
        name: error.name,
      });
      logDialerEvent("ERROR_BOUNDARY_COMPONENT_STACK", {
        stack: componentStack.slice(0, 500),
      });
    } catch {}
    this.setState({ errorInfo: componentStack.slice(0, 300) });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Your data is safe.
            </p>
            {this.state.error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3 mb-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
