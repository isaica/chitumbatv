import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('UI error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="max-w-xl mx-auto rounded-lg border bg-muted/30 p-6">
            <h2 className="text-xl font-semibold mb-2">Algo correu mal</h2>
            <p className="text-muted-foreground">Atualize a página ou volte para o Dashboard. Se persistir, contacte o administrador.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}