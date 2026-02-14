import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAPIWithAuth, uploadFile, API_URL } from "../lib/api";

interface SettingsSectionProps {
  role: string | null;
  currentUserId: string | null;
  tenantSector?: string | null;
}

export function SettingsSection({ role, currentUserId, tenantSector: initialTenantSector }: SettingsSectionProps) {
  const { t } = useTranslation();
  // Profile State
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  // Tenant Profile State
  const [tenantName, setTenantName] = useState("");
  const [tenantSector, setTenantSector] = useState(initialTenantSector || "");
  const [tenantCountry, setTenantCountry] = useState("");
  const [tenantCity, setTenantCity] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantOpeningTime, setTenantOpeningTime] = useState("09:00");
  const [tenantClosingTime, setTenantClosingTime] = useState("18:00");
  const [tenantAppointmentDuration, setTenantAppointmentDuration] = useState(60);
  const [tenantLanguage, setTenantLanguage] = useState("");
  const [tenantCurrency, setTenantCurrency] = useState("USD");
  const [tenantCoverUrl, setTenantCoverUrl] = useState("");
  const [tenantTablesCount, setTenantTablesCount] = useState<number>(0);
  const [tenantCapacity, setTenantCapacity] = useState<number>(0);
  const [tenantProfileLoading, setTenantProfileLoading] = useState(false);
  const [tenantProfileMessage, setTenantProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [tenantProfileSaving, setTenantProfileSaving] = useState(false);
  const [tenantLogoFile, setTenantLogoFile] = useState<File | null>(null);

  // AI Prompts State
  const [aiPromptCustomer, setAiPromptCustomer] = useState("");
  const [aiPromptSupport, setAiPromptSupport] = useState("");
  const [aiPromptInternal, setAiPromptInternal] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gpt-3.5-turbo");
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState("");
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState("");

  // Load User Profile
  useEffect(() => {
    if (currentUserId) {
        setProfileLoading(true);
        setProfileMessage(null);
        fetchAPIWithAuth('/users/profile')
            .then(data => {
                setProfileFirstName(data.firstName || "");
                setProfileLastName(data.lastName || "");
                setProfileEmail(data.email || "");
                setProfilePhone(data.phone || "");
                setProfileAddress(data.address || "");
                setProfileAvatarUrl(data.avatarUrl || null);
            })
            .catch(err => {
                console.error(err);
                setProfileMessage({type: 'error', text: t('settings.profile_load_error')});
            })
            .finally(() => setProfileLoading(false));
    }
  }, [currentUserId]);

  // Load Tenant Profile (for Admin/Superadmin)
  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') {
      setTenantProfileLoading(true);
      setTenantProfileMessage(null);
      fetchAPIWithAuth('/tenants/me')
        .then((data) => {
          setTenantName(data.name || "");
          setTenantSector(data.sector || "");
          setTenantCountry(data.country || "");
          setTenantCity(data.city || "");
          setTenantPhone(data.phone || "");
          setTenantEmail(data.email || "");
          setTenantLogoUrl(data.logoUrl || "");
          setTenantAddress(data.address || "");
          setTenantOpeningTime(data.openingTime || "09:00");
          setTenantClosingTime(data.closingTime || "18:00");
          setTenantAppointmentDuration(data.appointmentDuration || 60);
          setTenantLanguage(data.language || "");
          setTenantCurrency(data.currency || "USD");
          setTenantCoverUrl(data.coverUrl || "");
          setTenantTablesCount(data.tablesCount || 0);
          setTenantCapacity(data.capacity || 0);
          setAiPromptCustomer(data.aiPromptCustomer || "");
          setAiPromptSupport(data.aiPromptSupport || "");
          setAiPromptInternal(data.aiPromptInternal || "");
          setOpenaiApiKey(data.openaiApiKey || "");
          setAiModel(data.aiModel || "gpt-3.5-turbo");
          setMercadoPagoPublicKey(data.mercadoPagoPublicKey || "");
          setMercadoPagoAccessToken(data.mercadoPagoAccessToken || "");
        })
        .catch(() => {
          setTenantProfileMessage({
            type: 'error',
            text: t('settings.tenant_load_error'),
          });
        })
        .finally(() => {
          setTenantProfileLoading(false);
        });
    }
  }, [role]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);

    try {
      let avatarUrl = undefined;
      if (profileAvatarFile) {
        avatarUrl = await uploadFile(profileAvatarFile, 'avatars');
      }

      await fetchAPIWithAuth(`/users/profile`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: profileFirstName,
          lastName: profileLastName,
          email: profileEmail,
          phone: profilePhone,
          address: profileAddress,
          password: profilePassword || undefined,
          avatarUrl,
        }),
      });
      setProfileMessage({
        type: "success",
        text: t('settings.profile_update_success'),
      });
      setProfilePassword("");
      setProfileAvatarFile(null);
      
      // Update avatar preview if uploaded
      if (avatarUrl) {
          setProfileAvatarUrl(avatarUrl);
      }
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileMessage({
          type: "error",
          text: err.message || t('settings.update_error'),
        });
      } else {
        setProfileMessage({
          type: "error",
          text: t('settings.update_error'),
        });
      }
    }
  }

  async function handleUpdateTenantProfile(e: React.FormEvent) {
    e.preventDefault();
    setTenantProfileMessage(null);
    setTenantProfileSaving(true);

    try {
      let logoUrl = undefined;
      if (tenantLogoFile) {
        logoUrl = await uploadFile(tenantLogoFile, 'avatars');
      }

      await fetchAPIWithAuth('/tenants/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: tenantName || undefined,
          sector: tenantSector || undefined,
          country: tenantCountry || undefined,
          city: tenantCity || undefined,
          logoUrl: logoUrl || tenantLogoUrl || undefined,
          address: tenantAddress || undefined,
          phone: tenantPhone || undefined,
          email: tenantEmail || undefined,
          openingTime: tenantOpeningTime || undefined,
          closingTime: tenantClosingTime || undefined,
          appointmentDuration: Number(tenantAppointmentDuration) || 60,
          language: tenantLanguage || undefined,
          currency: tenantCurrency || undefined,
          coverUrl: tenantCoverUrl || undefined,
          aiPromptCustomer: aiPromptCustomer,
          aiPromptSupport: aiPromptSupport,
          aiPromptInternal: aiPromptInternal,
          openaiApiKey: openaiApiKey,
            aiModel: aiModel,
            mercadoPagoPublicKey: mercadoPagoPublicKey,
            mercadoPagoAccessToken: mercadoPagoAccessToken,
            tablesCount: tenantTablesCount,
            capacity: tenantCapacity,
          }),
        });
      
      if (logoUrl) {
        setTenantLogoUrl(logoUrl);
      }
      setTenantLogoFile(null);

      setTenantProfileMessage({
        type: 'success',
        text: t('settings.tenant_update_success'),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTenantProfileMessage({
          type: 'error',
          text: err.message || t('settings.tenant_update_error'),
        });
      } else {
        setTenantProfileMessage({
          type: 'error',
          text: t('settings.tenant_update_error'),
        });
      }
    } finally {
      setTenantProfileSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
        {/* User Profile Section */}
        <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-zinc-900">{t('settings.profile_title')}</h3>
            <p className="mt-2 text-sm text-zinc-800">
            {t('settings.profile_subtitle')}
            </p>

            {profileLoading ? (
            <div className="mt-6 text-sm text-zinc-700">{t('settings.loading_profile')}</div>
            ) : (
            <form onSubmit={handleUpdateProfile} className="mt-6 space-y-6">
                {profileMessage && (
                <div className={`p-4 rounded-md ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {profileMessage.text}
                </div>
                )}
                
                <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-zinc-900 block mb-2">{t('settings.profile_photo')}</label>
                    <div className="flex items-center gap-4">
                    {profileAvatarFile ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-zinc-200">
                            <img src={URL.createObjectURL(profileAvatarFile)} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                    ) : profileAvatarUrl ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-zinc-200">
                            <img src={profileAvatarUrl.startsWith('http') ? profileAvatarUrl : `${API_URL}${profileAvatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                        if (e.target.files?.[0]) {
                            setProfileAvatarFile(e.target.files[0]);
                        }
                        }}
                        className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
                    />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.form_name')}</label>
                    <input
                    type="text"
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    disabled={role === 'user'}
                    className={`h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 ${role === 'user' ? 'bg-zinc-100 text-zinc-500' : ''}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.form_lastname')}</label>
                    <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    disabled={role === 'user'}
                    className={`h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 ${role === 'user' ? 'bg-zinc-100 text-zinc-500' : ''}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.form_email')}</label>
                    <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    disabled={role === 'user'}
                    className={`h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 ${role === 'user' ? 'bg-zinc-100 text-zinc-500' : ''}`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.form_phone')}</label>
                    <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.form_address')}</label>
                    <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder={t('settings.address_placeholder')}
                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-zinc-900">
                    {t('settings.form_password')}
                    </label>
                    <input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder={t('settings.password_placeholder')}
                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                </div>
                </div>

                <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                    {t('settings.update_profile')}
                </button>
                </div>
            </form>
            )}
        </div>

        {/* Tenant Profile Section (Admin/Superadmin only) */}
        {(role === 'admin' || role === 'superadmin') && (
            <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-zinc-900">{t('settings.tenant_title')}</h3>
            <p className="mt-2 text-sm text-zinc-800">
                {t('settings.tenant_subtitle')}
            </p>

            {tenantProfileLoading ? (
                <div className="mt-6 text-sm text-zinc-700">{t('settings.loading_tenant')}</div>
            ) : (
                <form onSubmit={handleUpdateTenantProfile} className="mt-6 space-y-6">
                {tenantProfileMessage && (
                    <div className={`p-4 rounded-md ${tenantProfileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {tenantProfileMessage.text}
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-zinc-900 block mb-2">{t('settings.tenant_logo')}</label>
                        <div className="flex items-center gap-4">
                        {tenantLogoFile ? (
                            <div className="relative h-16 w-16 rounded-full overflow-hidden border border-zinc-200">
                                <img src={URL.createObjectURL(tenantLogoFile)} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        ) : tenantLogoUrl ? (
                            <div className="relative h-16 w-16 rounded-full overflow-hidden border border-zinc-200">
                                <img src={tenantLogoUrl.startsWith('http') ? tenantLogoUrl : `${API_URL}${tenantLogoUrl}`} alt="Logo" className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setTenantLogoFile(e.target.files[0]);
                            }
                            }}
                            className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
                        />
                        </div>
                    </div>

                    {(tenantSector || '').toLowerCase().includes('restaurante') && (
                        <>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_tables')}</label>
                            <input
                                type="number"
                                min="0"
                                value={tenantTablesCount}
                                onChange={(e) => setTenantTablesCount(parseInt(e.target.value) || 0)}
                                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_capacity')}</label>
                            <input
                                type="number"
                                min="0"
                                value={tenantCapacity}
                                onChange={(e) => setTenantCapacity(parseInt(e.target.value) || 0)}
                                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                        </>
                    )}
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_name')}</label>
                    <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    {!(tenantSector || '').toLowerCase().includes('restaurante') && !(tenantSector || '').toLowerCase().includes('restaurant') && (
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_sector')}</label>
                    <select
                        value={tenantSector}
                        onChange={(e) => setTenantSector(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    >
                        <option value="">{t('settings.select_placeholder')}</option>
                        <option value="salud">{t('settings.sector_health')}</option>
                        <option value="belleza">{t('settings.sector_beauty')}</option>
                        <option value="legal">{t('settings.sector_legal')}</option>
                        <option value="educacion">{t('settings.sector_education')}</option>
                        <option value="otros">{t('settings.sector_others')}</option>
                    </select>
                    </div>
                    )}
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_country')}</label>
                    <input
                        type="text"
                        value={tenantCountry}
                        onChange={(e) => setTenantCountry(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_city')}</label>
                    <input
                        type="text"
                        value={tenantCity}
                        onChange={(e) => setTenantCity(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_phone')}</label>
                    <input
                        type="tel"
                        value={tenantPhone}
                        onChange={(e) => setTenantPhone(e.target.value)}
                        placeholder={t('settings.phone_placeholder')}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_email')}</label>
                    <input
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder={t('settings.email_placeholder')}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    <p className="text-xs text-zinc-500">{t('settings.tenant_email_help')}</p>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.tenant_address')}</label>
                    <input
                        type="text"
                        value={tenantAddress}
                        onChange={(e) => setTenantAddress(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.opening_time')}</label>
                    <input
                        type="time"
                        value={tenantOpeningTime}
                        onChange={(e) => setTenantOpeningTime(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.closing_time')}</label>
                    <input
                        type="time"
                        value={tenantClosingTime}
                        onChange={(e) => setTenantClosingTime(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.appt_duration')}</label>
                    <input
                        type="number"
                        min="15"
                        step="15"
                        value={tenantAppointmentDuration}
                        onChange={(e) => setTenantAppointmentDuration(Number(e.target.value))}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    </div>
                    <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-zinc-900">{t('settings.currency')}</label>
                    <select
                        value={tenantCurrency}
                        onChange={(e) => setTenantCurrency(e.target.value)}
                        className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    >
                        <option value="USD">{t('settings.currency_usd')}</option>
                        <option value="COP">{t('settings.currency_cop')}</option>
                        <option value="EUR">{t('settings.currency_eur')}</option>
                        <option value="MXN">{t('settings.currency_mxn')}</option>
                    </select>
                    </div>

                    <div className="md:col-span-2 border-t border-zinc-200 pt-6 mt-4">
                        <h4 className="text-md font-medium text-zinc-900 mb-4">{t('settings.payment_config')}</h4>
                        <div className="grid gap-6 md:grid-cols-2 mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.mp_public_key')}</label>
                                <input
                                    type="text"
                                    value={mercadoPagoPublicKey}
                                    onChange={(e) => setMercadoPagoPublicKey(e.target.value)}
                                    placeholder="APP_USR-..."
                                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.mp_access_token')}</label>
                                <input
                                    type="password"
                                    value={mercadoPagoAccessToken}
                                    onChange={(e) => setMercadoPagoAccessToken(e.target.value)}
                                    placeholder="APP_USR-..."
                                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                />
                            </div>
                        </div>

                        <h4 className="text-md font-medium text-zinc-900 mb-4">{t('settings.ai_config_title')}</h4>
                        <p className="text-sm text-zinc-600 mb-6">
                            {t('settings.ai_config_desc')}
                        </p>

                        <div className="grid gap-6 md:grid-cols-2 mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.openai_key')}</label>
                                <input
                                    type="password"
                                    value={openaiApiKey}
                                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                />
                                <p className="text-xs text-zinc-500">{t('settings.openai_key_help')}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.ai_model')}</label>
                                <select
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="gpt-3.5-turbo">{t('settings.model_gpt35')}</option>
                                    <option value="gpt-4">{t('settings.model_gpt4')}</option>
                                    <option value="gpt-4-turbo">{t('settings.model_gpt4turbo')}</option>
                                    <option value="gpt-4o">{t('settings.model_gpt4o')}</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.bot_sales')}</label>
                                <textarea
                                    value={aiPromptCustomer}
                                    onChange={(e) => setAiPromptCustomer(e.target.value)}
                                    placeholder={t('settings.bot_sales_placeholder')}
                                    rows={4}
                                    className="rounded-md border border-zinc-400 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                />
                                <p className="text-xs text-zinc-500">{t('settings.bot_sales_help')}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.bot_support')}</label>
                                <textarea
                                    value={aiPromptSupport}
                                    onChange={(e) => setAiPromptSupport(e.target.value)}
                                    placeholder={t('settings.bot_support_placeholder')}
                                    rows={4}
                                    className="rounded-md border border-zinc-400 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                />
                                <p className="text-xs text-zinc-500">{t('settings.bot_support_help')}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-zinc-900">{t('settings.bot_internal')}</label>
                                <textarea
                                    value={aiPromptInternal}
                                    onChange={(e) => setAiPromptInternal(e.target.value)}
                                    placeholder={t('settings.bot_internal_placeholder')}
                                    rows={4}
                                    className="rounded-md border border-zinc-400 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                                />
                                <p className="text-xs text-zinc-500">{t('settings.bot_internal_help')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                    type="submit"
                    disabled={tenantProfileSaving}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                    {tenantProfileSaving ? t('common.loading') : t('settings.save_tenant')}
                    </button>
                </div>
                </form>
            )}
            </div>
        )}
    </div>
  );
}
