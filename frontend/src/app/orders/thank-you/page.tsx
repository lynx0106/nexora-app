import { redirect } from "next/navigation";

interface ThankYouPageProps {
  searchParams: Promise<{ orderId?: string; token?: string; status?: string }>;
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams;
  const { orderId, token, status } = params;

  if (orderId && token) {
    redirect(`/orders/status/${orderId}?token=${encodeURIComponent(token)}`);
  }

  const statusMessage =
    status === "success"
      ? "¡Pago recibido! Gracias por tu compra."
      : status === "failure"
        ? "El pago no pudo procesarse. Por favor intenta de nuevo."
        : status === "pending"
          ? "Tu pago está pendiente. Te notificaremos cuando sea confirmado."
          : "Gracias por tu compra.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-semibold text-emerald-400">
          {statusMessage}
        </h1>
        <p className="text-slate-400">
          {orderId
            ? `Si tienes el enlace que te enviamos por correo, podrás ver el estado de tu pedido #${orderId.slice(0, 8)}.`
            : "Recibirás un correo con la confirmación y los detalles."}
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
