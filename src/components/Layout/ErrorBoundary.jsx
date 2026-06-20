import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-right">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-md text-center space-y-6">
            <div className="mx-auto bg-rose-100 dark:bg-rose-950/30 p-4 rounded-full w-16 h-16 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">خطایی در برنامه رخ داده است</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                متأسفانه مشکلی در بارگذاری بخش مورد نظر پیش آمد. این خطا می‌تواند به دلیل عدم دسترسی به داده‌ها یا اشکال موقت باشد.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-xs bg-slate-100 dark:bg-slate-950 p-3 rounded-lg overflow-x-auto text-left font-mono text-rose-500 max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <Button 
              onClick={this.handleReload} 
              variant="danger" 
              className="w-full flex items-center justify-center space-x-2 space-x-reverse"
            >
              <RotateCcw className="h-4 w-4" />
              <span>بارگذاری مجدد صفحه</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
