import { OrderStatusView } from "@/components/OrderStatusView";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.startsWith("http") ?
    process.env.NEXT_PUBLIC_API_URL
  : "https://nexora-app-production-3104.up.railway.app";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function OrderStatusPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Pedido no encontrado
      </div>
    );
  }

  try {
    const url = new URL(`${API_URL}/public/orders/${id}`);
    if (token) url.searchParams.set("token", token);
    const res = await fetch(url.toString(), {
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
