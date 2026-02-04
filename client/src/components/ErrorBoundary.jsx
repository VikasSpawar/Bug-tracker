import { AlertTriangle, RotateCcw } from "lucide-react";
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error("Error caught:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative bg-navy-800 rounded-2xl shadow-2xl border border-navy-700 p-8 max-w-md w-full text-center z-10 animate-in zoom-in-95 duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="text-red-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                System Malfunction
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {this.state.error?.message ||
                  "An unexpected error occurred in the application core."}
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <div className="bg-navy-950 rounded-lg p-4 mb-6 text-left max-h-48 overflow-y-auto border border-navy-700 custom-scrollbar">
                <p className="text-xs font-mono text-red-300 whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </p>
                <div className="mt-2 pt-2 border-t border-navy-800">
                  <p className="text-[10px] font-mono text-slate-500">
                    Check console for full stack trace.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={this.resetError}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-semibold transition shadow-glow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <RotateCcw size={18} />
              Reboot Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
