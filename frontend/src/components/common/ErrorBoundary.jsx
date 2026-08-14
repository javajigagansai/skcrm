import React from 'react';
import { GoldenSKLogo } from './GoldenSKLogo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught Error Boundary Exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="inline-block p-3 bg-slate-900/80 rounded-2xl border border-slate-700">
              <GoldenSKLogo className="h-16 w-16 mx-auto object-contain" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-red-500 uppercase tracking-wide">
                SK SMART INVESTMENTS
              </h1>
              <p className="text-xs font-bold text-slate-300 mt-1">
                Insurance and Investments Specialist
              </p>
            </div>

            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-left">
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">Application State Exception</p>
              <p className="text-xs text-rose-200 font-mono break-all leading-relaxed">
                {this.state.error?.message || "An unexpected rendering error occurred."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                Reload Application
              </button>
              <button
                onClick={this.handleGoDashboard}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs border border-slate-600 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
