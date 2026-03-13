"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAPIWithAuth, logout } from "../../lib/api";
import { AgendaSection } from "../../components/AgendaSection";
import { OrdersSection } from "../../components/OrdersSection";
import { ProductsSection } from "../../components/ProductsSection";
import { TeamSection } from "../../components/TeamSection";
import { ClientsSection } from "../../components/ClientsSection";
import { TenantsSection } from "../../components/TenantsSection";
import { StatsSection } from "../../components/StatsSection";
import { InviteManager } from "../../components/InviteManager";
import { GlobalUserRow } from "../../components/GlobalUserRow";
import NotificationsDropdown from "../../components/NotificationsDropdown";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShoppingBag,
  Package,
  Calendar,
  CalendarDays,
  MessageSquare,
  Mail,
  UserCog,
  FileText,
  Settings,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";

const SettingsSection = dynamic(() => import("../../components/SettingsSection").then((m) => ({ default: m.SettingsSection })), {
  loading: () => <div className="animate-pulse h-32 rounded-lg bg-slate-800/50" />,
});
const ChatWidget = dynamic(() => import("../../components/ChatWidget").then((m) => ({ default: m.ChatWidget })), { ssr: false });
const ChatSection = dynamic(() => import("../../components/ChatSection").then((m) => ({ default: m.ChatSection })), {
  ssr: false,
  loading: () => <div className="animate-pulse h-64 rounded-lg bg-slate-800/50" />,
});
const AuditSection = dynamic(() => import("../../components/AuditSection").then((m) => ({ default: m.AuditSection })), {
  loading: () => <div className="animate-pulse h-32 rounded-lg bg-slate-800/50" />,
});

/**
 * Get user info from localStorage (stored during login)
 * The JWT token is now stored in httpOnly cookie and managed by the browser
 */
function getUserFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  
  // Try to get user data from localStorage (stored during login)
  const userJson = window.localStorage.getItem("user");
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      return {
        userId: user.id as string,
        role: (user.role as string | undefined) ?? "user",
        tenantId: (user.tenantId as string | undefined) ?? "",
      };
    } catch {
      // Fall through to null
    }
  }
  
  return null;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ userId: string; role: string; tenantId: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = getUserFromStorage();
      setUserInfo(user);
      setIsAuthChecking(false);
      
      if (!user) {
        router.push("/");
      }
    };

    // Small delay to ensure localStorage is ready and avoid race conditions
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // Loading state moved to render phase to prevent hook order issues
  
  const role = userInfo?.role ?? null;
  const currentUserId = userInfo?.userId ?? null;
  const tenantId = userInfo?.tenantId ?? "";
  
  const [allUsers, setAllUsers] = useState<
    { id: string; firstName: string; lastName: string; email: string; role?: string; isActive: boolean; tenantId?: string }[]
  >([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);

  const [selectedTenantIdForUsers, setSelectedTenantIdForUsers] = useState<string | null>(null);
  const [selectedTenantIdForClients, setSelectedTenantIdForClients] = useState<string | null>(null);
  const [selectedTenantIdForProducts, setSelectedTenantIdForProducts] = useState<string | null>(null);
  const [selectedTenantIdForOrders, setSelectedTenantIdForOrders] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<"resumen" | "usuarios" | "clientes" | "catalogo" | "pedidos" | "usuarios_globales" | "ajustes" | "agenda" | "reservas" | "empresas" | "mensajes" | "auditoria" | "invitaciones">("resumen");

  const [tenantCurrency, setTenantCurrency] = useState("USD");
  const [tenantSector, setTenantSector] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sector-based visibility logic
  const isRetail = !tenantSector || ['retail', 'comercio', 'restaurante', 'belleza', 'otros'].includes(tenantSector);
  const isService = !tenantSector || ['salud', 'belleza', 'legal', 'educacion', 'servicios', 'restaurante', 'otros'].includes(tenantSector);

  // Redirect 'user' role from 'resumen' to their first available section (deferred to avoid sync setState in effect)
  useEffect(() => {
    if (role === 'user' && activeSection === 'resumen') {
      const section = isService ? 'agenda' : isRetail ? 'pedidos' : 'ajustes';
      queueMicrotask(() => setActiveSection(section));
    }
  }, [role, activeSection, isService, isRetail]);

  useEffect(() => {
    const targetTenantId = 
      role === 'superadmin' 
        ? (activeSection === 'pedidos' ? selectedTenantIdForOrders : 
           activeSection === 'catalogo' ? selectedTenantIdForProducts : 
           tenantId)
        : tenantId;

    if (targetTenantId) {
      // Use public endpoint to get tenant details including currency
      fetchAPIWithAuth(`/public/tenant/${targetTenantId}`)
        .then(data => {
          if (data?.currency) setTenantCurrency(data.currency);
          if (data?.sector) setTenantSector(data.sector);
        })
        .catch(err => console.error("Failed to fetch tenant currency", err));
    }
  }, [role, tenantId, activeSection, selectedTenantIdForOrders, selectedTenantIdForProducts]);




  const [tenantSummary, setTenantSummary] = useState<
    { tenantId: string; name: string; sector?: string; totalUsers: number; activeUsers: number }[]
  >([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantSummaryError, setTenantSummaryError] = useState<string | null>(null);

  const fetchTenantSummary = useCallback(() => {
    if (role !== "superadmin") return;
    setLoadingTenants(true);
    setTenantSummaryError(null);
    fetchAPIWithAuth("/users/tenants/summary")
      .then((data) => {
        setTenantSummary(data ?? []);
      })
      .catch((error: unknown) => {
        setTenantSummaryError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las métricas de tenants"
        );
      })
      .finally(() => {
        setLoadingTenants(false);
      });
  }, [role]);

  useEffect(() => {
    if (role === "superadmin") {
      queueMicrotask(() => fetchTenantSummary());
    }
  }, [role, fetchTenantSummary]);

  useEffect(() => {
    if (role === "superadmin" && activeSection === "usuarios_globales") {
      queueMicrotask(() => {
        setLoadingAllUsers(true);
        setAllUsersError(null);
      });
      fetchAPIWithAuth("/users/all")
        .then((data) => {
          setAllUsers(data ?? []);
        })
        .catch((error: unknown) => {
          setAllUsersError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los usuarios globales"
          );
        })
        .finally(() => {
          setLoadingAllUsers(false);
        });
    }
  }, [role, activeSection]);

  function handleManageTenant(targetTenantId: string) {
    setSelectedTenantIdForUsers(targetTenantId);
    setSelectedTenantIdForClients(targetTenantId);
    setSelectedTenantIdForProducts(targetTenantId);
    setActiveSection("usuarios");
  }

  const renderNavItems = (mobile = false) => {
    const baseClass = mobile 
      ? "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium" 
      : "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm";
    
    const activeClass = "bg-slate-800 text-slate-100";
    const inactiveClass = "text-slate-300 hover:bg-slate-900/60";

    const getItemClass = (section: string) => 
      `${baseClass} ${activeSection === section ? activeClass : inactiveClass}`;

    const handleNavClick = (section: typeof activeSection) => {
      setActiveSection(section);
      if (mobile) setIsMobileMenuOpen(false);
    };

    const IconWrapper = ({ children, icon: Icon }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) => (
      <span className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        {children}
      </span>
    );

    return (
      <>
        {(role === "admin" || role === "superadmin") && (
          <button onClick={() => handleNavClick("resumen")} className={getItemClass("resumen")}>
            <IconWrapper icon={LayoutDashboard}><span>{t('sidebar.dashboard')}</span></IconWrapper>
          </button>
        )}
        
        {(role === "admin" || role === "superadmin" || (role === "user" && isService)) && (
          <button onClick={() => handleNavClick(role === 'superadmin' ? 'empresas' : 'usuarios')} className={getItemClass(role === 'superadmin' ? 'empresas' : 'usuarios')}>
            <IconWrapper icon={Building2}><span>{role === 'superadmin' ? t('sidebar.companies') : role === 'user' ? t('sidebar.professionals') : t('sidebar.team')}</span></IconWrapper>
          </button>
        )}

        {(role === "admin" || role === "superadmin") && (
          <button onClick={() => handleNavClick("clientes")} className={getItemClass("clientes")}>
            <IconWrapper icon={Users}><span>{t('sidebar.clients')}</span></IconWrapper>
          </button>
        )}

        {(role === "admin" || role === "superadmin" || (role === "user" && isRetail)) && (
          <button onClick={() => handleNavClick("catalogo")} className={getItemClass("catalogo")}>
            <IconWrapper icon={Package}><span>{role === 'user' ? t('sidebar.products') : t('sidebar.catalog')}</span></IconWrapper>
          </button>
        )}

        {(role === "admin" || role === "superadmin" || (role === "user" && isRetail)) && (
          <button onClick={() => handleNavClick("pedidos")} className={getItemClass("pedidos")}>
            <IconWrapper icon={ShoppingBag}><span>{role === 'user' ? t('sidebar.my_orders') : t('sidebar.orders')}</span></IconWrapper>
          </button>
        )}

        {(isService || role === 'superadmin') && (
          <button onClick={() => handleNavClick("agenda")} className={getItemClass("agenda")}>
            <IconWrapper icon={Calendar}><span>{role === 'user' ? t('sidebar.my_appointments') : t('sidebar.agenda')}</span></IconWrapper>
          </button>
        )}

        {((tenantSector === 'restaurante') || role === 'superadmin') && (
          <button onClick={() => handleNavClick("reservas")} className={getItemClass("reservas")}>
            <IconWrapper icon={CalendarDays}><span>{role === 'user' ? t('sidebar.my_reservations') : t('sidebar.reservations')}</span></IconWrapper>
          </button>
        )}

        {(role === "admin" || role === "superadmin") && (
          <button onClick={() => handleNavClick("mensajes")} className={getItemClass("mensajes")}>
            <IconWrapper icon={MessageSquare}><span>{t('sidebar.messages')}</span></IconWrapper>
          </button>
        )}

        {(role === "admin" || role === "superadmin") && (
          <button onClick={() => handleNavClick("invitaciones")} className={getItemClass("invitaciones")}>
            <IconWrapper icon={Mail}><span>Invitaciones y QR</span></IconWrapper>
          </button>
        )}

        {role === "superadmin" && (
           <button onClick={() => handleNavClick("usuarios_globales")} className={getItemClass("usuarios_globales")}>
            <IconWrapper icon={UserCog}><span>{t('sidebar.global_users')}</span></IconWrapper>
          </button>
        )}

        {role === "superadmin" && (
           <button onClick={() => handleNavClick("auditoria")} className={getItemClass("auditoria")}>
            <IconWrapper icon={FileText}><span>{t('sidebar.audit')}</span></IconWrapper>
          </button>
        )}

        <button onClick={() => handleNavClick("ajustes")} className={getItemClass("ajustes")}>
           <IconWrapper icon={Settings}><span>{t('sidebar.settings')}</span></IconWrapper>
        </button>

        {(role === "admin" || role === "superadmin") && (
             <Link href="/configuracion" onClick={() => mobile && setIsMobileMenuOpen(false)} className={mobile ? baseClass + " text-slate-300 hover:bg-slate-900/60" : "mt-4 inline-flex items-center gap-3 rounded-md px-3 py-2 text-left text-slate-300 hover:bg-slate-900/60"}>
                <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
                <span>{t('sidebar.configuration')}</span>
             </Link>
        )}
      </>
    );
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-slate-400">{t('dashboard.verifying')}</p>
        </div>
      </div>
    );
  }

  if (!userInfo || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-400">{t('dashboard.redirecting')}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex h-screen">
        <aside className="hidden md:flex flex-col flex-shrink-0 w-64 h-screen overflow-y-auto border-r border-slate-800 bg-slate-950/95 sticky top-0 px-4 py-6">
          <div className="mb-6 flex flex-col items-center flex-shrink-0">
              <Image 
                src="/logo-fondo.png" 
                alt="Logo Agencia" 
                width={80}
                height={80}
                className="mb-3 h-20 w-auto object-contain"
              />
            <div className="text-center text-sm font-semibold text-slate-100">
              NEXORA – El núcleo inteligente de tu negocio.
            </div>
            <div className="mt-2 inline-flex rounded-full bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-200">
              {t('common.role')}: {role?.toUpperCase()}
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 text-sm min-h-0 overflow-y-auto">
            {renderNavItems(false)}
          </nav>
          <button
            onClick={() => {
              logout();
            }}
            className="mt-4 flex-shrink-0 flex items-center gap-2 rounded-md border border-red-500/40 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('sidebar.logout')}
          </button>
          <div className="mt-4 flex-shrink-0 border-t border-slate-800 pt-4 text-center text-[11px] text-slate-500">
            Powered by Lynx IA
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <header className="flex-shrink-0 bg-slate-950/95 shadow-sm md:border-b md:border-slate-800 relative backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              {/* Logo Centered (or Left on Desktop if preferred, but keeping existing style mostly) */}
              <div className="flex flex-1 justify-center md:justify-start items-center gap-3">
                 <button 
                  className="md:hidden rounded-md p-2 text-slate-300 hover:bg-slate-900/60"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                <div className="flex flex-col items-center md:items-start gap-1">
                  <span className="block text-lg font-semibold text-slate-100 sm:text-2xl">
                    NEXORA
                  </span>
                  <span className="hidden md:block text-xs text-slate-400">
                    El núcleo inteligente de tu negocio.
                  </span>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <NotificationsDropdown />
                
                <div className="hidden md:flex items-center gap-4">
                   <span className="rounded-full bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-200">
                    {t('common.role')}: {role?.toUpperCase()}
                  </span>
                </div>

                <div className="md:hidden flex items-center gap-4">
                   {/* Mobile Menu or Logout */}
                   <button
                    onClick={() => {
                      logout();
                    }}
                    className="text-xs font-medium text-red-300"
                  >
                    {t('sidebar.logout')}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 w-full bg-slate-950 border-b border-slate-800 shadow-lg z-50 px-4 py-4 flex flex-col gap-2">
                 <div className="mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">{t('sidebar.navigation_menu')}</span>
                    <span className="rounded-full bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-200">
                      {role?.toUpperCase()}
                    </span>
                 </div>
                 {renderNavItems(true)}
              </div>
            )}
          </header>

          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col min-h-0 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
            <div key={activeSection} className="ds-section-transition">
            {activeSection === "resumen" && (
              <StatsSection
                role={role}
                tenantId={tenantId}
                tenantSummary={tenantSummary}
                onNavigate={setActiveSection}
                tenantSector={tenantSector}
              />
            )}

            {activeSection === "empresas" && role === 'superadmin' && (
              <TenantsSection
                tenants={tenantSummary}
                loading={loadingTenants}
                error={tenantSummaryError}
                onManage={handleManageTenant}
                onRefresh={fetchTenantSummary}
              />
            )}

        {activeSection === "usuarios" && (role === "admin" || role === "superadmin" || (role === "user" && isService)) && (
          <TeamSection
            role={role}
            tenantId={tenantId}
            selectedTenantId={selectedTenantIdForUsers}
            onTenantChange={setSelectedTenantIdForUsers}
            tenants={tenantSummary.map((t) => ({ id: t.tenantId, name: t.tenantId }))}
            tenantSector={tenantSector}
          />
        )}

        {activeSection === "clientes" && (role === "admin" || role === "superadmin") && (
          <ClientsSection
            role={role}
            tenantId={tenantId}
            selectedTenantId={selectedTenantIdForClients}
            onTenantChange={setSelectedTenantIdForClients}
            tenants={tenantSummary.map((t) => ({ id: t.tenantId, name: t.tenantId }))}
          />
        )}

        {activeSection === "catalogo" && (role === "admin" || role === "superadmin" || (role === "user" && isRetail)) && (
          <ProductsSection
            role={role}
            tenantId={tenantId}
            selectedTenantId={selectedTenantIdForProducts}
            onTenantChange={setSelectedTenantIdForProducts}
            tenants={tenantSummary.map((t) => ({ id: t.tenantId, name: t.tenantId }))}
            currency={tenantCurrency}
            tenantSector={tenantSector}
          />
        )}

            {activeSection === "ajustes" && (
              <SettingsSection
                role={role}
                currentUserId={currentUserId}
                tenantSector={tenantSector}
              />
            )}

            {activeSection === "agenda" && (
              <AgendaSection
                tenantId={role === 'superadmin' && selectedTenantIdForUsers ? selectedTenantIdForUsers : tenantId}
                role={role}
                currentUserId={currentUserId || ''}
                tenantSector={role === 'superadmin' ? 'service' : tenantSector} // Force service context if superadmin, or actual
                sectorFilter="service"
              />
            )}

            {activeSection === "reservas" && (
              <AgendaSection
                tenantId={role === 'superadmin' && selectedTenantIdForUsers ? selectedTenantIdForUsers : tenantId}
                role={role}
                currentUserId={currentUserId || ''}
                tenantSector={role === 'superadmin' ? 'restaurante' : tenantSector} // Force restaurant context
                sectorFilter="restaurante"
              />
            )}

            {activeSection === "pedidos" && (role === "admin" || role === "superadmin" || (role === "user" && isRetail)) && (
              <OrdersSection
                role={role}
                tenantId={tenantId}
                selectedTenantId={selectedTenantIdForOrders}
                onTenantChange={setSelectedTenantIdForOrders}
                tenants={tenantSummary.map(t => ({ id: t.tenantId, name: t.tenantId }))}
                currency={tenantCurrency}
                currentUserId={currentUserId}
              />
            )}

            {activeSection === "mensajes" && (role === "admin" || role === "superadmin") && (
              <ChatSection
                role={role}
                currentUserId={currentUserId}
                tenantId={tenantId}
                tenants={tenantSummary.map((t) => ({ id: t.tenantId, name: t.name || t.tenantId }))}
              />
            )}

            {activeSection === "invitaciones" && (role === "admin" || role === "superadmin") && (
              <InviteManager
                role={role}
                tenantId={tenantId}
                tenants={tenantSummary.map((t) => ({ id: t.tenantId, name: t.tenantId }))}
                onClose={() => setActiveSection("resumen")}
              />
            )}

            {activeSection === "usuarios_globales" && role === "superadmin" && (
              <div className="mb-8 rounded-lg bg-slate-900/70 border border-slate-800 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-slate-100">
                    Usuarios globales del SaaS
                  </h3>
                  <p className="mt-2 text-sm text-zinc-800">
                    Gestión de todos los usuarios del sistema. Aquí puedes editar roles y permisos.
                  </p>
                </div>

                {loadingAllUsers ? (
                  <p className="text-sm text-slate-300">Cargando usuarios globales...</p>
                ) : allUsersError ? (
                  <p className="text-sm text-red-600">{allUsersError}</p>
                ) : allUsers.length === 0 ? (
                  <p className="text-sm text-slate-300">Aún no hay usuarios registrados.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-800/80">
                        <tr className="border-b border-slate-700 text-xs uppercase text-slate-300">
                          <th className="py-2 pr-4">Tenant</th>
                          <th className="py-2 pr-4">Nombre</th>
                          <th className="py-2 pr-4">Correo</th>
                          <th className="py-2 pr-4">Rol</th>
                          <th className="py-2 pr-4">Estado</th>
                          <th className="py-2 pr-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-800">
                        {allUsers.map((user) => (
                          <GlobalUserRow 
                            key={user.id} 
                            user={user} 
                            onUpdate={(updatedUser) => {
                              setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeSection === "auditoria" && role === "superadmin" && (
              <AuditSection />
            )}
            </div>
          </main>
          <footer className="flex-shrink-0 mt-auto border-t border-slate-800 px-4 py-3 text-center text-[11px] text-slate-500 sm:px-6 lg:px-8">
            Powered by Lynx IA
          </footer>
        </div>
      </div>
      {/* Chat Widget */}
      {currentUserId && activeSection !== 'mensajes' && (
        <ChatWidget currentUserId={currentUserId} role={role} />
      )}
    </div>
  );
}
