import { OrderStatusView } from "@/components/OrderStatusView";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.startsWith("http") ?
    process.env.NEXT_PUBLIC_API_URL
  : "https://nexora-app-production-3104.up.railway.app";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderStatusPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Pedido no encontrado
      </div>
    );
  }

  try {
    const res = await fetch(`${API_URL}/public/orders/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
          {err?.message || "Error al cargar el pedido"}
        </div>
      );
    }

    const order = await res.json();

    if (!order?.id) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
          Pedido no encontrado
        </div>
      );
    }

    return <OrderStatusView order={order} />;
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
        Error al cargar el pedido
      </div>
    );
  }
}
