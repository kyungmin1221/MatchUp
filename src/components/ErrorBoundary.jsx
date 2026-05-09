import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
          <div className="max-w-md space-y-3">
            <h1 className="text-xl font-semibold">앱에서 오류가 발생했어요</h1>
            <p className="text-sm text-muted-foreground">
              브라우저 콘솔(F12 → Console)을 확인해 보세요.
            </p>
            <pre className="rounded bg-secondary p-3 text-left text-xs overflow-auto">
              {String(this.state.error?.message ?? this.state.error)}
            </pre>
            <button
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => location.reload()}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
