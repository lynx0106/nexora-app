import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAPIWithAuth } from "../lib/api";

interface StatsSectionProps {
  role: string;
  tenantId: string;
  tenantSummary: { tenantId: string; totalUsers: number; activeUsers: number }[];
  onNavigate: (section: any) => void;
  tenantSector?: string | null;
}

export function StatsSection({ role, tenantId, tenantSummary, onNavigate, tenantSector }: StatsSectionProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<{ 
    todayApptCount: number; 
    pendingApptCount: number; 
    todaySales: number; 
    todayOrdersCount: number;
    pendingOrdersCount: number;
  } | null>(null);
  
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loadingTopProducts, setLoadingTopProducts] = useState(false);
  
  const [activity, setActivity] = useState<any[]>([]);
  const [salesChart, setSalesChart] = useState<{ date: string; total: number }[]>([]);
  const [aiStats, setAiStats] = useState<any[]>([]);

  // Sector-based logic
  const isRetail = !tenantSector || ['retail', 'comercio', 'restaurante', 'belleza', 'otros'].includes(tenantSector);
  const isService = !tenantSector || ['salud', 'belleza', 'legal', 'educacion', 'servicios', 'otros'].includes(tenantSector);

  useEffect(() => {
    // Check onboarding status
    if (typeof window !== "undefined") {
      const hasSeen = window.localStorage.getItem("hasSeenDashboardOnboarding");
      if (!hasSeen) {
        setShowOnboarding(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    // Fetch Stats
    Promise.all([
      fetchAPIWithAuth(`/appointments/stats/${tenantId}`).catch(() => ({ todayCount: 0, pendingCount: 0 })),
      fetchAPIWithAuth(`/orders/stats/${tenantId}`).catch(() => ({ todaySales: 0, todayCount: 0, pendingCount: 0 })),
      fetchAPIWithAuth(`/dashboard/activity/${tenantId}`).catch(() => []),
      fetchAPIWithAuth(`/dashboard/charts/sales/${tenantId}`).catch(() => []),
      fetchAPIWithAuth(`/ai/usage/stats?tenantId=${tenantId}`).catch(() => [])
    ]).then(([apptStats, orderStats, activityData, salesData, aiData]) => {
      setStats({
        todayApptCount: apptStats.todayCount || 0,
        pendingApptCount: apptStats.pendingCount || 0,
        todaySales: orderStats.todaySales || 0,
        todayOrdersCount: orderStats.todayCount || 0,
        pendingOrdersCount: orderStats.pendingCount || 0
      });
      setActivity(activityData || []);
      setSalesChart(salesData || []);
      setAiStats(aiData || []);
    }).catch(console.error);

    // Fetch Top Products
    setLoadingTopProducts(true);
    fetchAPIWithAuth(`/orders/top-products/${tenantId}`)
      .then(data => setTopProducts(data || []))
      .catch(console.error)
      .finally(() => setLoadingTopProducts(false));

  }, [tenantId]);

  const dismissOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hasSeenDashboardOnboarding", "true");
    }
    setShowOnboarding(false);
  };

  const { t } = useTranslation();

  const getWelcomeMessage = () => {
    switch (role) {
      case 'doctor':
        return {
          title: t('stats.welcome_doctor_title'),
          description: t('stats.welcome_doctor_desc')
        };
      case 'support':
        return {
          title: t('stats.welcome_support_title'),
          description: t('stats.welcome_support_desc')
        };
      case 'user':
        return {
          title: t('stats.welcome_user_title'),
          description: t('stats.welcome_user_desc')
        };
      default:
        return {
          title: t('stats.welcome_admin_title'),
          description: t('stats.welcome_admin_desc')
        };
    }
  };

  const welcomeMsg = getWelcomeMessage();

  return (
    <div className="space-y-8">
      {/* Onboarding Section */}
      {showOnboarding && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">
            Tus primeros pasos en NEXORA
          </h2>
          <p className="mt-2 text-sm text-emerald-900">
            Te dejamos una guía rápida para que saques partido al panel desde el primer día.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-emerald-900">
            <li>
              Completa los datos de tu negocio en la sección <span className="font-semibold">Ajustes → Identidad de tu negocio</span>.
            </li>
            <li>
              {role === 'superadmin' ? (
                 <>Gestiona tus empresas desde la sección <span className="font-semibold">Empresas</span>.</>
              ) : (
                 <>Invita a tu equipo desde la sección <span className="font-semibold">Equipo</span> y define sus permisos.</>
              )}
            </li>
            {role === "superadmin" && (
              <li>
                Revisa las cuentas de cliente desde la <span className="font-semibold">vista global de cuentas</span> y asegura que todo está correctamente creado.
              </li>
            )}
          </ol>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-emerald-800">
              Este mensaje solo se muestra la primera vez que entras al panel.
            </span>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Entendido, empezar ahora
            </button>
          </div>
        </div>
      )}

      {/* AI Consumption Stats (Superadmin/Admin) */}
      {(role === 'superadmin' || role === 'admin') && aiStats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
             {aiStats.map((stat: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-purple-100 bg-purple-50 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Consumo AI ({stat.provider})</p>
                            <p className="mt-1 text-2xl font-semibold text-purple-900">
                                {new Intl.NumberFormat().format(stat.totalTokens)} <span className="text-sm font-normal">tokens</span>
                            </p>
                        </div>
                        <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                            🤖
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-purple-700">
                        Modelo: {stat.model} • {stat.requestCount} peticiones
                    </div>
                </div>
             ))}
        </div>
      )}

      {/* Superadmin Global View */}
      {role === "superadmin" && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-indigo-900">
                Vista global de cuentas (superadmin)
              </h2>
              <p className="mt-2 text-sm text-indigo-700">
                Gestiona todas las cuentas de cliente y consulta indicadores globales.
              </p>
            </div>
            <button
              onClick={() => onNavigate("empresas")}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Gestionar Empresas
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-md bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-700">Tenants activos</div>
              <div className="text-2xl font-bold text-zinc-900">
                {tenantSummary.length}
              </div>
            </div>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-700">Usuarios totales</div>
              <div className="text-2xl font-bold text-zinc-900">
                {tenantSummary.reduce((acc, t) => acc + t.totalUsers, 0)}
              </div>
            </div>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-700">Usuarios activos</div>
              <div className="text-2xl font-bold text-zinc-900">
                {tenantSummary.reduce((acc, t) => acc + t.activeUsers, 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Context */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-zinc-900">
          {welcomeMsg.title}
        </h3>
        <p className="mt-2 text-sm text-zinc-800">
          {welcomeMsg.description}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {(role !== 'user' || isService) && (
            <>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                 <h4 className="text-sm font-medium text-zinc-500">{role === 'user' ? t('stats.my_appointments_today') : t('stats.appointments_today')}</h4>
                 <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.todayApptCount}</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                 <h4 className="text-sm font-medium text-zinc-500">{role === 'user' ? t('stats.my_pending_requests') : t('stats.pending_requests')}</h4>
                 <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.pendingApptCount}</p>
              </div>
            </>
          )}

          {(role !== 'user' || isRetail) && (
            <>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                 <h4 className="text-sm font-medium text-zinc-500">{role === 'user' ? t('stats.my_purchases_today') : t('stats.sales_today')}</h4>
                 <p className="mt-2 text-3xl font-bold text-zinc-900">
                   {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(stats.todaySales)}
                 </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                 <h4 className="text-sm font-medium text-zinc-500">{role === 'user' ? t('stats.my_orders_today') : t('stats.orders_today')}</h4>
                 <div className="mt-2 flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-zinc-900">{stats.todayOrdersCount}</span>
                   {stats.pendingOrdersCount > 0 && (
                     <span className="text-sm font-medium text-amber-600">({stats.pendingOrdersCount} pendientes)</span>
                   )}
                 </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Chart (2 cols) */}
        <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
           <div className="mb-6 flex items-center justify-between">
             <h3 className="text-lg font-medium text-zinc-900">{t('stats.sales_chart_title')}</h3>
           </div>
           <div className="flex h-64 items-end gap-2 border-b border-zinc-200 pb-4 sm:gap-4">
              {salesChart.length > 0 ? (
                salesChart.map((item) => {
                  const maxSales = Math.max(...salesChart.map(d => Number(d.total)), 1);
                  const heightPercent = Math.max((Number(item.total) / maxSales) * 100, 2); // Min 2% height
                  return (
                   <div key={item.date} className="group relative flex flex-1 flex-col justify-end gap-2">
                      <div 
                         className="w-full rounded-t bg-indigo-600 transition-all hover:bg-indigo-700"
                         style={{ height: `${heightPercent}%` }}
                      >
                         <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block z-10">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(item.total))}
                         </div>
                      </div>
                      <span className="text-center text-[10px] text-zinc-500 sm:text-xs">
                        {new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                      </span>
                   </div>
                  );
                })
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                  {t('stats.no_sales_data')}
                </div>
              )}
           </div>
        </div>

        {/* Recent Activity (1 col) */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
           <h3 className="mb-4 text-lg font-medium text-zinc-900">{t('stats.recent_activity')}</h3>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {activity.map((item) => (
                 <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                    <div className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full ${item.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                       {item.type === 'order' ? (
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                       ) : (
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       )}
                    </div>
                    <div>
                       <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                       <p className="text-xs text-zinc-500">{item.description}</p>
                       <p className="mt-1 text-[10px] text-zinc-400">{new Date(item.date).toLocaleString()}</p>
                    </div>
                 </div>
              ))}
              {activity.length === 0 && <p className="text-sm text-zinc-500">{t('stats.no_activity')}</p>}
           </div>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-zinc-900">{t('stats.top_products')}</h3>
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-700">{t('stats.product')}</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 text-right">{t('stats.unit_price')}</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 text-right">{t('stats.units_sold')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {topProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="h-8 w-8 rounded object-cover" />
                      )}
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600">
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-900">
                      {p.total_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
