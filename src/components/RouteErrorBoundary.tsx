import { Component, type ErrorInfo, type ReactNode } from "react";
import { clearChunkRetryFlag } from "@/lib/chunkRecovery";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Erro ao carregar rota:", error, errorInfo);
  }

  handleReload = () => {
    clearChunkRetryFlag();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-lg">
            <p className="text-sm font-semibold text-primary">Falha temporária de carregamento</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
              Recarregue para continuar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Detectei um conflito de cache nos arquivos do app e evitei a tela branca.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Recarregar agora
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}