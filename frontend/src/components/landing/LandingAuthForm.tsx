"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Briefcase, Store, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_URL } from "@/lib/api";
import { isValidEmail, validatePassword } from "@/lib/validation";

type ProfileType = "client" | "employee" | "admin" | "superadmin";

export default function LandingAuthForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const inviteId = searchParams.get("id") || searchParams.get("invitationId");
  const inviteTenantId = searchParams.get("tenant") || searchParams.get("tenantId");
  const inviteRole = searchParams.get("role") as ProfileType | null;

  const [isLogin, setIsLogin] = useState(true);
  const [activeProfile, setActiveProfile] = useState<ProfileType>(inviteRole ?? "admin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [sector, setSector] = useState("salud");
  const [country, setCountry] = useState("Colombia");
  const [currency, setCurrency] = useState("COP");
  const [plan, setPlan] = useState<"starter" | "pro">("starter");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (inviteRole) {
      setActiveProfile(inviteRole);
      setIsLogin(false);
    }
  }, [inviteRole]);

  const handleCountryChange = (val: string) => {
    setCountry(val);
    if (val === "Colombia") setCurrency("COP");
    else if (val === "Mexico") setCurrency("MXN");
    else if (val === "Spain") setCurrency("EUR");
    else setCurrency("USD");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isValidEmail(email.trim())) {
      setError(t("auth.validation_email_invalid"));
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError(pwCheck.message ?? t("auth.validation_password_min"));
      return;
    }
    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) {
        setError(t("auth.validation_required"));
        return;
      }
      if (!inviteTenantId && !tenantName.trim()) {
        setError(t("auth.validation_required"));
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? `${API_URL}/auth/login` : `${API_URL}/tenants/register`;

      if (isLogin) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? t("auth.generic_error"));

        if (data.accessToken) {
          localStorage.setItem("token", data.accessToken);
        }

        const user = data.user;
        localStorage.setItem("user", JSON.stringify(user));

        setSuccess(t("auth.login_success"));
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        if (!inviteTenantId && activeProfile === "admin") {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: tenantName,
              plan,
              sector,
              adminFirstName: firstName,
              adminLastName: lastName,
              adminEmail: email,
              adminPassword: password,
              country,
              currency,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message ?? t("auth.generic_error"));

          setSuccess(t("auth.register_success"));
          setIsLogin(true);
        } else if (inviteTenantId ?? inviteId) {
          const registerEndpoint = `${API_URL}/auth/register`;
          const body: Record<string, string> = {
            firstName,
            lastName,
            email,
            password,
          };
          if (inviteId) {
            body.invitationId = inviteId;
          } else if (inviteTenantId) {
            body.tenantId = inviteTenantId;
            body.role = activeProfile;
          }

          const res = await fetch(registerEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message ?? t("auth.generic_error"));

          setSuccess(t("auth.register_success"));
          setIsLogin(true);
        } else {
          if (activeProfile === "client") {
            setError(t("auth.invite_only_client"));
            setLoading(false);
            return;
          }
          if (activeProfile === "employee") {
            setError(t("auth.invite_only_employee"));
            setLoading(false);
            return;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.generic_error"));
    } finally {
      if (!success) setLoading(false);
    }
  };

  const profileConfig: Record<ProfileType, { title: string; desc: string; icon: React.ReactNode; color: string; lightColor: string }> = {
    client: {
      title: t("auth.roles.client"),
      desc: t("auth.role_descs.client"),
      icon: <User className="w-5 h-5" />,
      color: "bg-emerald-600 hover:bg-emerald-700",
      lightColor: "bg-emerald-900/40 text-emerald-200 border-emerald-700",
    },
    employee: {
      title: t("auth.roles.employee"),
      desc: t("auth.role_descs.employee"),
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-blue-600 hover:bg-blue-700",
      lightColor: "bg-blue-900/40 text-blue-200 border-blue-700",
    },
    admin: {
      title: t("auth.roles.admin"),
      desc: t("auth.role_descs.admin"),
      icon: <Store className="w-5 h-5" />,
      color: "bg-indigo-600 hover:bg-indigo-700",
      lightColor: "bg-indigo-900/40 text-indigo-200 border-indigo-700",
    },
    superadmin: {
      title: t("auth.roles.superadmin"),
      desc: t("auth.role_descs.superadmin"),
      icon: <Lock className="w-5 h-5" />,
      color: "bg-slate-800 hover:bg-slate-700",
      lightColor: "bg-slate-900 text-slate-100 border-slate-700",
    },
  };

  const currentConfig = profileConfig[activeProfile];

  if (!mounted) return null;

  return (
    <section id="auth" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <Image
            src="/logo-fondo.png"
            alt="NEXORA"
            width={64}
            height={64}
            className="mb-4 h-16 w-16 object-contain"
          />
          <h2 className="font-display text-2xl font-semibold ds-text">
            {t("auth.access_system")}
          </h2>
          <p className="mt-2 text-sm ds-muted">{t("auth.select_account_type")}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 p-1 ds-card mb-6">
          {(Object.keys(profileConfig) as ProfileType[]).map((profile) => (
            <button
              key={profile}
              type="button"
              onClick={() => {
                if (inviteRole && inviteRole !== profile) {
                  setError(t("auth.invite_link_error", { profile: profileConfig[inviteRole].title }));
                  return;
                }
                setActiveProfile(profile);
                setError(null);
                setSuccess(null);
                if (!inviteTenantId) setIsLogin(true);
              }}
              disabled={!!inviteRole && inviteRole !== profile}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                activeProfile === profile
                  ? "ds-choice-active"
                  : inviteRole && inviteRole !== profile
                    ? "opacity-50 cursor-not-allowed ds-muted"
                    : "ds-choice"
              }`}
            >
              <div className={`mb-1 p-1.5 rounded-full ${activeProfile === profile ? profileConfig[profile].lightColor : "bg-transparent"}`}>
                {profileConfig[profile].icon}
              </div>
              <span className="capitalize hidden sm:block">{profileConfig[profile].title}</span>
              <span className="capitalize sm:hidden">{profileConfig[profile].title.substring(0, 3)}</span>
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <h3
            className={`text-lg font-semibold ${
              activeProfile === "client"
                ? "text-emerald-600"
                : activeProfile === "employee"
                  ? "text-blue-600"
                  : activeProfile === "admin"
                    ? "text-indigo-300"
                    : "ds-soft"
            }`}
          >
            {currentConfig.title}
          </h3>
          <p className="text-sm ds-muted mt-1">{currentConfig.desc}</p>
        </div>

        <div className="ds-panel px-6 py-8">
          <form className="space-y-6" onSubmit={handleSubmit} action="#">
            {isLogin && (
              <>
                <div>
                  <label htmlFor="auth-email" className="block text-sm font-medium ds-muted">
                    {t("auth.email_label")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ds-input w-full text-sm"
                      placeholder="nombre@ejemplo.com"
                      style={{ backgroundColor: "var(--color-surface-3)" }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-sm font-medium ds-muted">
                    {t("auth.password_label")}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ds-input w-full text-sm pr-10"
                      placeholder="••••••••"
                      style={{ backgroundColor: "var(--color-surface-3)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-1 text-right">
                    <Link href="/auth/forgot-password" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                      {t("auth.forgot_password")}
                    </Link>
                  </div>
                </div>
              </>
            )}

            {!isLogin && (
              <div className="space-y-4">
                {inviteTenantId ? (
                  <div className="text-xs text-teal-200 bg-teal-900/30 p-2 rounded border border-teal-700">
                    {t("auth.registering_in", {
                      tenant: inviteTenantId.replace(/-/g, " "),
                      role: profileConfig[activeProfile].title,
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-amber-200 bg-amber-900/30 p-2 rounded border border-amber-700">
                    {t("auth.registering_new_business")}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium ds-muted">{t("auth.first_name")}</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="ds-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium ds-muted">{t("auth.last_name")}</label>
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
                    <label className="block text-sm font-medium ds-muted">{t("auth.tenant_name")}</label>
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="ds-input w-full text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium ds-muted">{t("auth.email_label")}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ds-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium ds-muted">{t("auth.password_label")}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ds-input w-full text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!inviteTenantId && activeProfile === "admin" && (
                  <div>
                    <label className="block text-sm font-medium ds-muted mb-2">{t("auth.plan_label")}</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPlan("starter")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          plan === "starter"
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : "border-slate-600 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        Starter — $29/mes
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlan("pro")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          plan === "pro"
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : "border-slate-600 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        Pro — $79/mes
                      </button>
                    </div>
                  </div>
                )}

                {!inviteTenantId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium ds-muted">{t("auth.sector_label")}</label>
                      <select value={sector} onChange={(e) => setSector(e.target.value)} className="ds-input w-full text-sm">
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
                      <label className="block text-sm font-medium ds-muted">{t("auth.country_label")}</label>
                      <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className="ds-input w-full text-sm">
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

            {error && (
              <div className="ds-alert ds-alert-error">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">{t("auth.error_title")}</h3>
                    <div className="mt-2 text-sm">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="ds-alert ds-alert-success">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">
                      {success.includes("Nota") ? t("auth.redirecting") : t("auth.success_title")}
                    </h3>
                    <div className="mt-2 text-sm">
                      <p>{success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`ds-button flex w-full justify-center text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${currentConfig.color} focus:ring-teal-500`}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? t("auth.login_button") : t("auth.register_business_button")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t ds-divider" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="ds-divider-label px-2">O</span>
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
                {isLogin
                  ? inviteTenantId
                    ? t("auth.create_account_invite")
                    : t("auth.create_business_account")
                  : t("auth.back_to_login")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
