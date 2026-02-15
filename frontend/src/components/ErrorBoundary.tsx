"use client";

import React from "react";
import { showToast } from "../lib/toast";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    showToast("Ocurrio un error en la interfaz", "error");
    console.error("ErrorBoundary:", error);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="ds-panel max-w-md w-full p-6 text-center">
            <h2 className="text-xl font-semibold ds-text">Algo salio mal</h2>
            <p className="mt-2 text-sm ds-muted">
              Ocurrio un error inesperado. Puedes recargar la pagina.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="ds-button ds-button-primary mt-4"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
