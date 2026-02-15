"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "../lib/toast";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: ToastType }>;
      const message = customEvent.detail?.message || "Ha ocurrido un error";
      const type = customEvent.detail?.type || "error";
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
    };

    window.addEventListener("nexora:toast", handler);
    return () => window.removeEventListener("nexora:toast", handler);
  }, []);

  return (
    <div className="ds-toast-layer" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`ds-toast ds-toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
