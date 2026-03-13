import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Uso | NEXORA",
  description: "Términos y condiciones de uso del servicio NEXORA. Contrato de usuario para la plataforma SaaS.",
};

export default function TermsPage() {
  const lastUpdated = "12 de marzo de 2026";
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm ds-muted hover:text-[var(--color-accent)] mb-8 transition-colors">
          ← Volver al inicio
        </Link>
        <div className="flex items-center gap-3 mb-12">
          <Image src="/logo-fondo.png" alt="NEXORA" width={48} height={48} className="object-contain" />
          <h1 className="font-display text-2xl font-bold ds-text">Términos y Condiciones de Uso</h1>
        </div>
        <div className="ds-card p-8 space-y-8">
          <p className="ds-muted text-sm">
            Última actualización: {lastUpdated}
          </p>
          <p className="ds-soft text-sm leading-relaxed">
            Los presentes Términos y Condiciones (&quot;Términos&quot;) rigen el acceso y uso del servicio NEXORA, plataforma SaaS de gestión empresarial disponible en nexora-app.online, operada por Lynx IA. Al registrarse o utilizar el servicio, usted acepta estos Términos. Si actúa en nombre de una empresa, declara tener autoridad para obligarla.
          </p>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">1. Descripción del servicio</h2>
            <p className="ds-soft text-sm leading-relaxed">
              NEXORA es una plataforma multitenant que permite a empresas gestionar productos, pedidos, citas, clientes, chat, pagos e inteligencia artificial. El servicio se presta &quot;tal cual&quot; (as is), conforme a la documentación y planes comerciales vigentes. Nos reservamos el derecho de modificar funcionalidades con aviso razonable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">2. Registro y cuenta</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Para acceder al servicio debe registrarse con información veraz. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas bajo su cuenta. Debe notificarnos de inmediato cualquier uso no autorizado. Las cuentas son personales e intransferibles; el administrador del tenant puede gestionar usuarios según los permisos del plan contratado.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">3. Uso aceptable</h2>
            <p className="ds-soft text-sm leading-relaxed mb-2">
              Usted se compromete a:
            </p>
            <ul className="list-disc pl-5 space-y-1 ds-soft text-sm">
              <li>Utilizar el servicio de forma lícita y conforme a la normativa aplicable en su jurisdicción.</li>
              <li>No emplear el servicio para actividades fraudulentas, ilegales o que infrinjan derechos de terceros.</li>
              <li>No intentar acceder a datos de otros tenants ni vulnerar la seguridad del sistema.</li>
              <li>Asegurar que los datos que introduce (incluidos los de clientes finales) cumplan la normativa de protección de datos aplicable.</li>
              <li>No usar el servicio para enviar spam o contenido malicioso.</li>
            </ul>
            <p className="ds-soft text-sm leading-relaxed mt-3">
              Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">4. Planes, facturación y pagos</h2>
            <p className="ds-soft text-sm leading-relaxed">
              El acceso está sujeto al plan contratado (Starter, Pro, Enterprise u otros vigentes). Los precios, límites y condiciones se indican al contratar. La suscripción se renueva según lo acordado (mensual o anual) hasta que se cancele. Es su responsabilidad abonar a tiempo; la falta de pago puede resultar en suspensión del servicio. Los impuestos aplicables son responsabilidad del usuario según su jurisdicción.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">5. Propiedad intelectual</h2>
            <p className="ds-soft text-sm leading-relaxed">
              NEXORA, el software, la marca, el diseño y los materiales asociados son propiedad de Lynx IA o sus licenciantes. Se le concede una licencia limitada, no exclusiva e intransferible para usar el servicio conforme a estos Términos. Usted conserva la propiedad de los datos que introduce; nos concede una licencia para procesarlos con el fin de prestar el servicio. No puede copiar, modificar, descompilar o realizar ingeniería inversa del software sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">6. Limitación de responsabilidad</h2>
            <p className="ds-soft text-sm leading-relaxed">
              En la máxima medida permitida por la ley aplicable: (a) el servicio se proporciona &quot;tal cual&quot;; (b) no garantizamos disponibilidad ininterrumpida o libre de errores; (c) no seremos responsables por daños indirectos, consecuentes, especiales o punitivos, incluyendo lucro cesante; (d) nuestra responsabilidad total en cualquier caso se limitará al monto pagado por usted en los doce (12) meses anteriores al hecho que origine la reclamación. Esta limitación aplica independientemente de la teoría jurídica invocada.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">7. Indemnización</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Usted acepta indemnizar y mantener indemne a Lynx IA, NEXORA y sus afiliados frente a reclamaciones, daños, costas y gastos (incluidos honorarios razonables de abogados) que surjan de: (i) su uso del servicio; (ii) violación de estos Términos; (iii) violación de derechos de terceros; o (iv) los datos que introduzca o los actos de sus usuarios finales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">8. Terminación</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Puede cancelar su cuenta en cualquier momento desde la configuración o contactando soporte. Nos reservamos el derecho de suspender o terminar el acceso por incumplimiento de estos Términos o por motivos de seguridad. Tras la terminación, deberá cesar todo uso del servicio. Las disposiciones que por su naturaleza deban sobrevivir (propiedad intelectual, limitación de responsabilidad, indemnización) permanecerán en vigor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">9. Modificaciones</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Podemos modificar estos Términos con aviso previo razonable (por ejemplo, 30 días) mediante publicación en el sitio o notificación por correo. El uso continuado tras la entrada en vigor de los cambios constituye su aceptación. Si no está de acuerdo, puede cancelar su cuenta antes de la fecha de vigencia. Para cambios sustanciales que reduzcan sus derechos, le daremos la oportunidad de rechazar expresamente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">10. Ley aplicable y jurisdicción</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Estos Términos se rigen por las leyes de la República de Colombia, sin perjuicio de las disposiciones imperativas de protección al consumidor de su país de residencia. Para usuarios en la Unión Europea, se aplicarán las disposiciones de la legislación de su Estado miembro. Las controversias se resolverán ante los tribunales competentes de Colombia, salvo que la ley imperativa de su jurisdicción exija otro foro.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">11. Disposiciones generales</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Si alguna cláusula resultara nula o inaplicable, las demás permanecerán en vigor. La falta de ejercicio de un derecho no constituirá renuncia. Estos Términos constituyen el acuerdo completo entre las partes respecto al servicio. No se permite la cesión de estos Términos sin consentimiento por escrito; nosotros podemos cederlos en caso de fusión, adquisición o venta de activos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold ds-text mb-3">12. Contacto</h2>
            <p className="ds-soft text-sm leading-relaxed">
              Para consultas sobre estos Términos: utilice el canal de soporte indicado en su panel de NEXORA o la opción de contacto del sitio nexora-app.online.
            </p>
          </section>
        </div>
        <div className="mt-8 flex gap-6">
          <Link href="/privacy" className="text-sm text-[var(--color-accent)] hover:underline">
            Política de Privacidad
          </Link>
          <Link href="/" className="text-sm text-[var(--color-accent)] hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
