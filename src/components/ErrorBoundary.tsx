import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f6f2]">
          <div className="max-w-md w-full mx-4 p-8 bg-white border border-[#e0dad0] text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#c46a6a]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#c46a6a]" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-[#2c2822] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#8a8070] mb-4">
              {this.state.error?.message || "An unexpected error occurred while rendering the application."}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2c2822] hover:bg-[#4a443e] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
