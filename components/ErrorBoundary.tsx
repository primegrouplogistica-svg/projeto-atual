import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onRetry: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Prime] Erro ao renderizar:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 max-w-md">
            <p className="text-slate-300 text-sm mb-2">Algo deu errado ao carregar esta tela.</p>
            <p className="text-slate-500 text-xs mb-6">Seu registro foi salvo. Clique em Voltar para continuar.</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onRetry();
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl transition-colors"
            >
              Voltar ao painel
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
