import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad | NEXORA",
  description: "Política de privacidad y protección de datos personales de NEXORA. Cumplimiento GDPR, CCPA, LGPD y normativas de LATAM.",
};

export default function PrivacyPage() {
  const lastUpdated = "12 de marzo de 2026";
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm ds-muted hover:text-[var(--color-accent)] mb-8 transition-colors">
          ← Volver al inicio
        </Link>
        <div className="flex items-center gap-3 mb-12">
          <Image src="/logo-fondo.png" alt="NEXORA" width={48} height={48} className="object-contain" />
          <h1 className="font-display text-2xl font-bold ds-text">Política de Privacidad</h1>
        </div>
        <div className="ds-card p-8 space-y-8">
          <p className="ds-muted text-sm">
            Última actualización: {lastUpdated}
          </p>
          <p className="ds-soft text-sm leading-relaxed">
            Esta Política de Privacidad describe cómo NEXORA (&quot;nosotros&quot;, &quot;nuestra&quot; o &quot;el responsable&quot;) recopila, utiliza y protege la información personal de los usuarios del servicio de gestión empresarial SaaS en nexora-app.online. Aplicamos medidas para cumplir con el Reglamento General de Protección de Datos (GDPR) de la Unión Europea, la Ley de Privacidad del Consumidor de California (CCPA), la Ley General de Protección de Datos (LGPD) de Brasil, la Ley 1581 de 2012 de Colombia, la Ley Federal de Protección de Datos Personales (LFPDPPP) de México y demás normativas aplicables.
          </p>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">1. Responsable del tratamiento</h2>
            <p className="ds-soft text-sm leading-relaxed">
              El responsable del tratamiento de sus datos personales es NEXORA, plataforma SaaS operada por Lynx IA. Para ejercer sus derechos o consultas sobre privacidad, utilice el canal de soporte indicado en su panel de usuario o el formulario de contacto del sitio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">2. Datos que recopilamos</h2>
            <p className="ds-soft text-sm leading-relaxed mb-2">
              Recopilamos los datos que usted nos proporciona directamente:
            </p>
            <ul className="list-disc pl-5 space-y-1 ds-soft text-sm">
              <li><strong className="ds-text">Datos de identificación:</strong> nombre, apellidos, correo electrónico.</li>
              <li><strong className="ds-text">Datos de la cuenta:</strong> contraseña cifrada, rol (administrador, empleado, cliente).</li>
              <li><strong className="ds-text">Datos del negocio (tenant):</strong> nombre del negocio, sector, país, moneda, dirección, teléfono, logo, configuraciones.</li>
              <li><strong className="ds-text">Datos de transacción:</strong> pedidos, citas, reservas, historial de pagos.</li>
              <li><strong className="ds-text">Datos técnicos:</strong> dirección IP, tipo de navegador, sesiones de uso (logs de auditoría).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">3. Finalidades y bases legales</h2>
            <p className="ds-soft text-sm leading-relaxed mb-2">
              Utilizamos sus datos para:
            </p>
            <ul className="list-disc pl-5 space-y-1 ds-soft text-sm">
              <li>Proporcionar el servicio de gestión empresarial (ejecución del contrato).</li>
              <li>Gestionar pedidos, citas, clientes y pagos (interés legítimo / cumplimiento contractual).</li>
              <li>Enviar comunicaciones sobre el servicio, recuperación de contraseña y novedades (consentimiento o interés legítimo).</li>
              <li>Cumplir obligaciones legales (requisitos fiscales, contables, normativos).</li>
              <li>Mejorar la plataforma, detectar fraudes y garantizar la seguridad (interés legítimo).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">4. Sus derechos (GDPR, CCPA, LGPD, Ley 1581)</h2>
            <p className="ds-soft text-sm leading-relaxed mb-2">
              Según su jurisdicción, puede ejercer los siguientes derechos:
            </p>
            <ul className="list-disc pl-5 space-y-1 ds-soft text-sm">
              <li><strong className="ds-text">Acceso:</strong> solicitar una copia de sus datos personales.</li>
              <li><strong className="ds-text">Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong className="ds-text">Supresión («derecho al olvido»):</strong> solicitar la eliminación de sus datos.</li>
              <li><strong className="ds-text">Portabilidad:</strong> recibir sus datos en formato estructurado y de uso común.</li>
              <li><strong className="ds-text">Oposición:</strong> oponerse al tratamiento en determinadas circunstancias.</li>
              <li><strong className="ds-text">Limitación:</strong> solicitar la restricción del tratamiento.</li>
              <li><strong className="ds-text">Retirar el consentimiento:</strong> cuando el tratamiento se base en su consentimiento.</li>
            </ul>
            <p className="ds-soft text-sm leading-relaxed mt-3">
              Para ejercer estos derechos, contacte a través del soporte indicado en su panel. En la Unión Europea puede presentar una reclamación ante la autoridad de protección de datos de su país. En California (EE. UU.) no vendemos datos personales; puede ejercer sus derechos CCPA contactando al responsable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">5. Conservación de datos</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Conservamos sus datos mientras mantenga una cuenta activa y durante el tiempo necesario para cumplir obligaciones legales (por ejemplo, facturación, registros fiscales). Tras la baja, eliminamos o anonimizamos los datos en un plazo razonable, salvo obligación de conservación legal.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">6. Transferencias internacionales</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Los datos pueden almacenarse o procesarse en servidores ubicados fuera de su país de residencia (por ejemplo, en la Unión Europea o Estados Unidos). Garantizamos medidas adecuadas (cláusulas contractuales tipo, certificaciones) cuando las transferencias se realicen a países sin nivel de protección equivalente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">7. Seguridad</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Aplicamos medidas técnicas y organizativas adecuadas: cifrado de contraseñas, conexiones seguras (HTTPS/TLS), control de acceso, auditoría de acciones y protección frente a accesos no autorizados. Ningún método de transmisión por Internet es 100% seguro; seguimos las buenas prácticas del sector.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">8. Cookies y tecnologías similares</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Utilizamos cookies esenciales para la autenticación y el funcionamiento del servicio. Puede gestionar las preferencias de cookies en su navegador. Las cookies no esenciales (analíticas, si las hubiere) se utilizarán según su consentimiento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">9. Menores</h2>
            <p className="ds-soft text-sm leading-relaxed">
              El servicio no está dirigido a menores de 16 años (o la edad de consentimiento en su jurisdicción). No recopilamos intencionalmente datos de menores; si tiene conocimiento de que un menor nos ha proporcionado datos, contacte para solicitar su eliminación.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">10. Contacto</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Para ejercer sus derechos, presentar dudas o reclamaciones sobre privacidad: utilice el canal de soporte indicado en su panel de NEXORA o la opción de contacto del sitio web nexora-app.online.
            </p>
          </section>
        </div>
        <div className="mt-8 flex gap-6">
          <Link href="/terms" className="text-sm text-[var(--color-accent)] hover:underline">
            Términos de Uso
          </Link>
          <Link href="/" className="text-sm text-[var(--color-accent)] hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
