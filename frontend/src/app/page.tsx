"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Briefcase, Store, Lock, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { API_URL } from "@/lib/api";

type ProfileType = 'client' | 'employee' | 'admin' | 'superadmin';

function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Parse invite params
  const inviteTenantId = searchParams.get('tenantId');
  const inviteRole = searchParams.get('role') as ProfileType | null;

  const [isLogin, setIsLogin] = useState(true);
  const [activeProfile, setActiveProfile] = useState<ProfileType>(inviteRole || 'admin');
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [sector, setSector] = useState("salud");
  const [country, setCountry] = useState("Colombia");
  const [currency, setCurrency] = useState("COP");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // If invited, auto-select role and mode
    if (inviteRole) {
      setActiveProfile(inviteRole);
      setIsLogin(false); // Default to register for invite
    }
  }, [inviteRole]);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleCountryChange = (val: string) => {
    setCountry(val);
    if (val === 'Colombia') setCurrency('COP');
    else if (val === 'Mexico') setCurrency('MXN');
    else if (val === 'Spain') setCurrency('EUR');
    else setCurrency('USD');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = isLogin 
        ? `${API_URL}/auth/login`
        : `${API_URL}/tenants/register`; // Only for tenant register or generic register?
      
      // If inviting user (client/employee) to EXISTING tenant, we need a different endpoint 
      // OR the tenant register endpoint must handle user creation if tenantId is provided.
      // Current backend `tenants/register` creates a NEW tenant and an ADMIN user.
      // It does NOT support adding a user to an existing tenant.
      // We need to use `auth/register` (if it exists) or `users/register`.
      // Let's assume for this demo we only support Login for everyone, and Register for NEW Tenants (Admin).
      // If invited, we might need a special flow. 
      // For now, let's implement the standard paths.

      if (isLogin) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || t('auth.generic_error'));

        // Store token
        localStorage.setItem("token", data.accessToken);
        const user = data.user;
        localStorage.setItem("user", JSON.stringify(user));

        // Redirect based on role
        setSuccess(t('auth.login_success'));
        setTimeout(() => {
            if (user.role === 'superadmin') router.push('/dashboard');
            else if (user.role === 'admin') router.push('/dashboard');
            else if (user.role === 'employee') router.push('/dashboard'); // Employee dashboard
            else router.push('/dashboard'); // Client dashboard or store? Usually clients go to store or client portal.
            // For now all to dashboard, logic inside dashboard handles views.
        }, 1000);

      } else {
        // REGISTER FLOW
        // Case 1: New Tenant (Admin)
        if (!inviteTenantId && activeProfile === 'admin') {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: tenantName,
                sector: sector,
                firstName,
                lastName,
                email,
                password,
                country,
                currency
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || t('auth.generic_error'));
            
            setSuccess(t('auth.register_success'));
            setIsLogin(true);
        } 
        // Case 2: Invited User (Client/Employee) -> Register into existing tenant
        else if (inviteTenantId) {
            // We need an endpoint for this. `auth/register`?
            // If not implemented, we show error.
            // Assuming `auth/register` exists for users.
            const registerEndpoint = `${API_URL}/auth/register`;
            
            const res = await fetch(registerEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tenantId: inviteTenantId,
                role: activeProfile, // 'client' or 'employee'
                firstName,
                lastName,
                email,
                password
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || t('auth.generic_error'));

            setSuccess(t('auth.register_success'));
            setIsLogin(true);
        } else {
            // Public User Registration (without invite) - Disabled for now or restricted
            if (activeProfile === 'client') {
                 setError(t('auth.invite_only_client'));
                 setLoading(false);
                 return;
            }
             if (activeProfile === 'employee') {
                 setError(t('auth.invite_only_employee'));
                 setLoading(false);
                 return;
            }
        }
      }
    } catch (err: any) {
      setError(err.message || t('auth.generic_error'));
    } finally {
      if (!success) setLoading(false);
    }
  }

  const profileConfig = {
    client: {
      title: t('auth.roles.client'),
      desc: t('auth.role_descs.client'),
      icon: <User className="w-5 h-5" />,
      color: "bg-emerald-600 hover:bg-emerald-700",
      lightColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    employee: {
      title: t('auth.roles.employee'),
      desc: t('auth.role_descs.employee'),
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-blue-600 hover:bg-blue-700",
      lightColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    admin: {
      title: t('auth.roles.admin'),
      desc: t('auth.role_descs.admin'),
      icon: <Store className="w-5 h-5" />,
      color: "bg-indigo-600 hover:bg-indigo-700",
      lightColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    superadmin: {
      title: t('auth.roles.superadmin'),
      desc: t('auth.role_descs.superadmin'),
      icon: <Lock className="w-5 h-5" />,
      color: "bg-zinc-800 hover:bg-zinc-900",
      lightColor: "bg-zinc-100 text-zinc-800 border-zinc-200"
    }
  };

  const currentConfig = profileConfig[activeProfile];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
        title="Cambiar tema"
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="w-full max-w-md space-y-8">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center">
           <img 
             src="/logo.png" 
             alt="Logo Agencia" 
             className="mb-2 h-24 w-auto object-contain"
           />
           <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
            {t('auth.access_system')}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            {t('auth.select_account_type')}
          </p>
        </div>

        {/* Profile Selector */}
        <div className="grid grid-cols-4 gap-2 p-1 ds-card">
          {(Object.keys(profileConfig) as ProfileType[]).map((profile) => (
            <button
              key={profile}
              onClick={() => {
                if (inviteRole && inviteRole !== profile) {
                  // Prevent switching if invited for specific role
                  setError(t('auth.invite_link_error', { profile: profileConfig[inviteRole].title }));
                  return;
                }
                setActiveProfile(profile);
                setError(null);
                setSuccess(null);
                // If invite exists, stay on register, else reset to login
                if (!inviteTenantId) setIsLogin(true);
              }}
              disabled={!!inviteRole && inviteRole !== profile}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                activeProfile === profile
                  ? "bg-white shadow-sm text-slate-900 ring-1 ring-slate-200"
                  : !!inviteRole && inviteRole !== profile 
                    ? "opacity-50 cursor-not-allowed text-slate-400" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <div className={`mb-1 p-1.5 rounded-full ${activeProfile === profile ? profileConfig[profile].lightColor : "bg-transparent"}`}>
                {profileConfig[profile].icon}
              </div>
              <span className="capitalize hidden sm:block">
                 {profileConfig[profile].title}
              </span>
              <span className="capitalize sm:hidden">
                 {profileConfig[profile].title.substring(0, 3)}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Context Header */}
        <div className="text-center">
           <h3 className={`text-lg font-semibold ${
             activeProfile === 'client' ? 'text-emerald-600' :
             activeProfile === 'employee' ? 'text-blue-600' :
             activeProfile === 'admin' ? 'text-indigo-600' : 'text-slate-700'
           }`}>
             {currentConfig.title}
           </h3>
           <p className="text-sm text-slate-500 mt-1">
             {currentConfig.desc}
           </p>
        </div>

        {/* Form */}
        <div className="ds-panel px-6 py-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Login Fields */}
            {isLogin && (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-600"
                  >
                    {t('auth.email_label')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ds-input w-full text-sm"
                      placeholder="nombre@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-600"
                  >
                    {t('auth.password_label')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ds-input w-full text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Register Fields (Only for Admin/Tenant currently) */}
            {!isLogin && (
              <div className="space-y-4">
                 {inviteTenantId ? (
                    <div className="text-xs text-teal-700 bg-teal-50 p-2 rounded border border-teal-200">
                      {t('auth.registering_in', { tenant: inviteTenantId.replace(/-/g, ' '), role: profileConfig[activeProfile].title })}
                    </div>
                 ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      {t('auth.registering_new_business')}
                    </div>
                 )}

                 {/* Existing register fields logic... */}
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">
                      {t('auth.first_name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="ds-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">
                      {t('auth.last_name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="ds-input w-full text-sm"
                    />
                  </div>
                </div>

                {!inviteTenantId && (
                <div>
                  <label className="block text-sm font-medium text-slate-600">
                    {t('auth.tenant_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="ds-input w-full text-sm"
                  />
                </div>
                )}

                 {/* Email & Password for Register */}
                 <div>
                  <label className="block text-sm font-medium text-slate-600">
                    {t('auth.email_label')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ds-input w-full text-sm"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-600">
                    {t('auth.password_label')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ds-input w-full text-sm"
                  />
                </div>

                {!inviteTenantId && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">
                        {t('auth.sector_label')}
                        </label>
                        <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="ds-input w-full text-sm"
                        >
                        <option value="salud">Salud</option>
                        <option value="legal">Legal</option>
                        <option value="belleza">Belleza</option>
                        <option value="restaurante">Restaurante</option>
                        <option value="retail">Retail</option>
                        <option value="servicios">Servicios</option>
                        <option value="educacion">Educación</option>
                        <option value="otros">Otros</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600">
                        {t('auth.country_label')}
                        </label>
                        <select
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="ds-input w-full text-sm"
                        >
                        <option value="Colombia">Colombia</option>
                        <option value="Mexico">México</option>
                        <option value="Spain">España</option>
                        <option value="United States">United States</option>
                        </select>
                    </div>
                </div>
                )}
              </div>
            )}

            {/* Error / Success Messages */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {t('auth.error_title')}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-emerald-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-emerald-800">
                      {success.includes("Nota") ? t('auth.redirecting') : t('auth.success_title')}
                    </h3>
                    <div className="mt-2 text-sm text-emerald-700">
                      <p>{success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`ds-button flex w-full justify-center text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${currentConfig.color} focus:ring-teal-500`}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? t('auth.login_button') : t('auth.register_business_button')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-400">
                  O
                </span>
              </div>
            </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                        setSuccess(null);
                    }}
                    className="ds-button ds-button-ghost flex w-full justify-center text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    {isLogin ? (inviteTenantId ? t('auth.create_account_invite') : t('auth.create_business_account')) : t('auth.back_to_login')}
                  </button>
                </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
