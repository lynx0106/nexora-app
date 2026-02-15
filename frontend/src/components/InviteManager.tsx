import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { Copy, Check, QrCode, Link as LinkIcon, Download, ArrowLeft, X } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
}

interface InviteManagerProps {
  role: string | null;
  tenantId: string;
  tenants: Tenant[];
  onClose?: () => void;
}

export function InviteManager({ role, tenantId, tenants, onClose }: InviteManagerProps) {
  const { t } = useTranslation();
  // States
  const [selectedRole, setSelectedRole] = useState<string>("client");
  const [targetTenantId, setTargetTenantId] = useState<string>(tenantId);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Initialize targetTenantId when tenantId prop changes
  useEffect(() => {
    if (tenantId) setTargetTenantId(tenantId);
  }, [tenantId]);

  // Generate Link Logic
  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      // Format: /?action=register&tenant=XYZ&role=client
      const link = `${baseUrl}/?action=register&tenant=${targetTenantId}&role=${selectedRole}`;
      setGeneratedLink(link);
    }
  }, [selectedRole, targetTenantId]);

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download QR
  const downloadQR = () => {
    const svg = document.getElementById("invite-qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${selectedRole}-${targetTenantId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-slate-800 transition-colors"
                        title={t('invite.back')}
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-300" />
                    </button>
                )}
                <h3 className="text-lg font-medium text-slate-100">
                {t('invite.title')}
                </h3>
            </div>
            {onClose && (
                <button 
                    onClick={onClose}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    title={t('invite.close')}
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
            <p className="mt-2 text-sm text-slate-400">
          {t('invite.description')}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Controls */}
          <div className="space-y-6">
            
            {/* Superadmin Tenant Selector */}
            {role === "superadmin" && (
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Empresa Objetivo
                </label>
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                >
                  <option value="">Seleccionar Empresa...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Como Superadmin, puedes generar invitaciones para cualquier negocio.
                </p>
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Tipo de Usuario a Invitar
              </label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedRole("client")}
                  className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all ${
                    selectedRole === "client"
                      ? "border-emerald-500 bg-emerald-900/30 text-emerald-200"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="mb-1 text-lg">🛍️</span>
                  Cliente
                </button>
                <button
                  onClick={() => setSelectedRole("employee")}
                  className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all ${
                    selectedRole === "employee"
                      ? "border-blue-500 bg-blue-900/30 text-blue-200"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="mb-1 text-lg">💼</span>
                  Empleado
                </button>
                <button
                  onClick={() => setSelectedRole("admin")}
                  className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all ${
                    selectedRole === "admin"
                      ? "border-indigo-500 bg-indigo-900/30 text-indigo-200"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="mb-1 text-lg">🏢</span>
                  Dueño Empresa
                </button>
              </div>
            </div>

            {/* Link Display */}
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Enlace Mágico Generado
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="block w-full rounded-l-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-emerald-400 focus:ring-emerald-400"
                />
                <button
                  onClick={copyToClipboard}
                  className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copiar</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Comparte este enlace por WhatsApp, Email o Redes Sociales.
              </p>
            </div>
          </div>

          {/* QR Preview */}
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 text-center">
              <h4 className="text-sm font-medium text-slate-100 flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" />
                Código QR para Escanear
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Ideal para imprimir y colocar en mostrador
              </p>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-lg shadow-sm border border-slate-800">
                <QRCode
                id="invite-qr-code"
                value={generatedLink}
                size={200}
                level="H"
                className="h-auto max-w-full"
                />
            </div>

            {/* Print/Download Button (Placeholder functionality) */}
            <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => window.open(generatedLink, '_blank')}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800"
                >
                    <LinkIcon className="w-4 h-4" />
                    Probar Link
                </button>
                {/* Note: Real SVG download needs a bit more logic or a library, but browser print works */}
                <button 
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={() => {
                      // Simple print trigger
                       const printWindow = window.open('', '', 'width=600,height=600');
                       const svg = document.getElementById("invite-qr-code");
                       if (printWindow && svg) {
                           printWindow.document.write(`
                             <html>
                               <head><title>Imprimir QR - ${selectedRole}</title></head>
                               <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                                 <h2>Escanea para registrarte como ${selectedRole === 'client' ? 'Cliente' : selectedRole === 'employee' ? 'Colaborador' : 'Dueño Empresa'}</h2>
                                 <p>${targetTenantId}</p>
                                 <div style="margin: 20px;">
                                   ${svg.outerHTML}
                                 </div>
                                 <p>saas-app.com</p>
                               </body>
                             </html>
                           `);
                           printWindow.document.close();
                           printWindow.focus();
                           printWindow.print();
                       }
                  }}
                >
                    <Download className="w-4 h-4" />
                    Imprimir QR
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
