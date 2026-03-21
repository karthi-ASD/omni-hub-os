import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DialerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[DIALER] DIALER_RENDER_CRASH", {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50 bg-destructive/5 m-6">
          <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold mb-1">Dialer crashed</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                An unexpected error occurred in the dialer interface. Your voice
                connection may still be active.
              </p>
              <p className="text-xs font-mono text-destructive mt-2 max-w-lg break-all">
                {this.state.error?.message}
              </p>
            </div>
            <Button onClick={this.handleRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
