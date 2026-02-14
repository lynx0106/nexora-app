import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { TenantsService } from '../tenants/tenants.service';
import { AiUsage } from './entities/ai-usage.entity';

@Injectable()
export class AiService {
  private logger = new Logger(AiService.name);

  constructor(
    private tenantsService: TenantsService,
    @InjectRepository(AiUsage)
    private aiUsageRepository: Repository<AiUsage>,
  ) {}

  // Helper to get configured OpenAI client for this tenant
  private async getOpenAIClient(tenantId: string): Promise<OpenAI | null> {
    const tenant = await this.tenantsService.findOne(tenantId);

    // 1. Try Tenant's Custom Key
    if (tenant?.openaiApiKey) {
      return new OpenAI({ apiKey: tenant.openaiApiKey });
    }

    // 2. Fallback to System Key
    if (process.env.OPENAI_API_KEY) {
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    return null;
  }

  async generateReply(
    scope: string,
    message: string,
    tenantId: string,
    context: any[] = [],
  ): Promise<{ content: string | null; shouldPauseAi: boolean }> {
    // Keyword detection for Human Handoff (Always active)
    const lower = message.toLowerCase();
    if (
      lower.includes('humano') ||
      lower.includes('persona') ||
      lower.includes('asesor') ||
      lower.includes('human')
    ) {
      return {
        content:
          '¡Claro! Enseguida te paso con un agente humano. ¡Un momento por favor!',
        shouldPauseAi: true,
      };
    }

    // Check if we should ignore internal messages unless tagged
    if (
      scope === 'INTERNAL' &&
      !(lower.includes('@ai') || lower.includes('bot'))
    ) {
      return { content: null, shouldPauseAi: false };
    }

    const client = await this.getOpenAIClient(tenantId);

    // If API Key exists (Tenant or System), use OpenAI
    if (client) {
      try {
        return await this.generateOpenAIReply(
          client,
          scope,
          message,
          tenantId,
          context,
        );
      } catch (error) {
        this.logger.error('OpenAI API Error:', error);
        // Fallback to mock if API fails
        return this.generateMockReply(scope, message, tenantId);
      }
    }

    // Fallback to Mock
    return this.generateMockReply(scope, message, tenantId);
  }

  private async generateOpenAIReply(
    client: OpenAI,
    scope: string,
    message: string,
    tenantId: string,
    context: any[],
  ): Promise<{ content: string | null; shouldPauseAi: boolean }> {
    const isFirstInteraction = !context || context.length === 0;
    const systemMessage = await this.getSystemPrompt(
      scope,
      tenantId,
      isFirstInteraction,
    );
    const tenant = await this.tenantsService.findOne(tenantId);
    const model = tenant?.aiModel || 'gpt-3.5-turbo';

    // Build messages array with context if available
    const messages: any[] = [{ role: 'system', content: systemMessage }];

    if (context && context.length > 0) {
      messages.push(...context);
    }

    messages.push({ role: 'user', content: message });

    const completion = await client.chat.completions.create({
      messages: messages,
      model: model,
    });

    const reply = completion.choices[0].message.content;

    // Track Usage
    try {
      const usage = completion.usage;
      if (usage) {
        await this.aiUsageRepository.save({
          tenantId: tenantId,
          provider: 'openai', // dynamic if we support others
          model: model,
          scope: scope,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        });
        this.logger.log(
          `AI Usage logged for tenant ${tenantId}: ${usage.total_tokens} tokens`,
        );
      }
    } catch (err) {
      this.logger.error('Failed to log AI usage', err);
    }

    return { content: reply, shouldPauseAi: false };
  }

  private async getSystemPrompt(
    scope: string,
    tenantId: string,
    isFirstInteraction: boolean = false,
  ): Promise<string> {
    const tenant = await this.tenantsService.findOne(tenantId);
    // Fallback safe prompt if tenant not found
    if (!tenant) return 'Eres un asistente útil.';

    // 2. Generate Dynamic "Fine-Tuned" Prompts based on Tenant Data
    const businessName = tenant.name;
    const sector = tenant.sector || 'Comercio General';
    const currency = tenant.currency || 'USD';
    const schedule = `${tenant.openingTime} - ${tenant.closingTime}`;
    const country = tenant.country || 'tu región';

    let interactionInstruction = '';
    if (isFirstInteraction) {
      interactionInstruction = `\n[CONTEXTO ACTUAL: INICIO DE CONVERSACIÓN]\n- Este es el PRIMER mensaje. TU PRIORIDAD OBLIGATORIA es: Saludar, decir "Soy el asistente virtual de ${businessName}" y PREGUNTAR "¿Con quién tengo el gusto?" o "¿Cual es tu nombre?".\n- NO respondas dudas complejas aún, prioriza obtener el nombre.`;
    } else {
      interactionInstruction = `\n[CONTEXTO ACTUAL: CONVERSACIÓN EN CURSO]\n- NO te presentes de nuevo ("Soy el asistente..."). YA LO SABEN.\n- Si en el historial (mensajes anteriores) el usuario dijo su nombre, ÚSALO para personalizar.\n- Si NO sabes el nombre aún, puedes preguntarlo sutilmente al final, pero responde primero la duda.`;
    }

    if (scope === 'CUSTOMER') {
      if (tenant.aiPromptCustomer)
        return tenant.aiPromptCustomer + interactionInstruction;

      return `Actúa como un experto Asistente de Ventas y Atención al Cliente para "${businessName}", un negocio líder en el sector de ${sector} ubicado en ${country}.
        
Tus Instrucciones Estrictas de Comportamiento:
1.  **Rol y Límites**: ERES EXCLUSIVAMENTE un asistente de ventas y atención al cliente. NO respondas preguntas personales, de cultura general, política, deportes o temas ajenos al negocio. Si te preguntan algo fuera de tema, responde amablemente: "Disculpa, solo puedo ayudarte con información sobre nuestros servicios y productos."
2.  **Localización y Modismos**: ADAPTA tu vocabulario y expresiones a los modismos propios de **${country}**. Habla como un local, pero manteniendo la formalidad y respeto.
3.  **Objetivo**: Resolver dudas, dar información de productos/servicios y motivar la compra/reserva.
4.  **Contexto**: Horario: ${schedule}. Moneda: ${currency}.
5.  **Guía Amable**: Guía al usuario paso a paso. Si no sabes algo, invítalo a escribir 'asesor' para hablar con un humano.

${interactionInstruction}`;
    }

    if (scope === 'SUPPORT') {
      if (tenant.aiPromptSupport) return tenant.aiPromptSupport;
      return `Actúa como un Agente de Soporte Técnico Nivel 1 para "${businessName}" en ${country}.
        
Tus Instrucciones Estrictas:
1.  **Rol**: Solo resuelves dudas técnicas sobre el uso de la plataforma y configuración del negocio. NO hables de ventas ni temas externos.
2.  **Localización**: Usa un español técnico pero adaptado a **${country}**.
3.  **Tono**: Paciente, pedagógico y muy respetuoso. Entiende que el usuario puede no ser experto.

${interactionInstruction}`;
    }

    if (scope === 'INTERNAL') {
      if (tenant.aiPromptInternal) return tenant.aiPromptInternal;
      return `Actúa como un Asistente Ejecutivo para el equipo de "${businessName}" en ${country}.
        
Tus Instrucciones:
1.  **Rol**: Ayuda con redacción, correos y tareas administrativas.
2.  **Localización**: Usa modismos de negocios de **${country}**.
3.  **Eficiencia**: Sé directo y profesional.`;
    }

    return 'Eres un asistente útil.';
  }

  // Refactor: make it async to fetch tenant details
  private async generateMockReply(
    scope: string,
    message: string,
    tenantId: string,
  ): Promise<{ content: string | null; shouldPauseAi: boolean }> {
    // Fetch tenant details for dynamic mock responses
    const tenant = await this.tenantsService.findOne(tenantId);
    const businessName = tenant?.name || 'la tienda';
    const sector = tenant?.sector || 'comercio';
    const country = tenant?.country || 'tu región';

    let reply: string | null = null;
    const lower = message.toLowerCase();

    if (scope === 'CUSTOMER') {
      reply = this.customerAgentResponse(
        message,
        businessName,
        sector,
        country,
      );
    } else if (scope === 'SUPPORT') {
      reply = this.supportAgentResponse(message);
    } else if (scope === 'INTERNAL') {
      reply =
        '🤖 Soy tu asistente de equipo. (Funcionalidad de IA simulada. Conecta tu API Key para respuestas reales).';
    }

    return { content: reply, shouldPauseAi: false };
  }

  private customerAgentResponse(
    message: string,
    businessName: string,
    sector: string,
    country: string,
  ): string {
    const lower = message.toLowerCase();

    if (
      lower.includes('precio') ||
      lower.includes('costo') ||
      lower.includes('cuanto vale')
    ) {
      return '💰 Nuestros precios dependen del servicio. Puedes ver el catálogo completo en nuestra página de reservas o agendar una cita para cotizar.';
    }

    if (
      lower.includes('horario') ||
      lower.includes('abierto') ||
      lower.includes('cerrado')
    ) {
      return '🕒 Nuestro horario de atención habitual es de Lunes a Sábado de 9:00 AM a 6:00 PM.';
    }

    if (
      lower.includes('cita') ||
      lower.includes('agendar') ||
      lower.includes('reservar')
    ) {
      return "📅 Puedes agendar tu cita directamente desde nuestra página pública o haciendo clic en el botón 'Reservar'.";
    }

    // Detectar nombre (lógica básica mock)
    if (
      lower.includes('me llamo') ||
      lower.includes('soy ') ||
      lower.includes('mi nombre es')
    ) {
      const name = message.split(' ').pop() || 'Usuario'; // Intento muy básico de extraer nombre
      return `¡Un gusto, ${name}! ¿En qué puedo colaborarte el día de hoy en ${businessName}?`;
    }

    if (
      lower.includes('hola') ||
      lower.includes('buenas') ||
      lower.includes('hi')
    ) {
      return `👋 ¡Hola de nuevo! Recuerda que estoy aquí para ayudarte con dudas sobre nuestros servicios en ${sector}.`;
    }

    // Default fallback
    return "Entendido. Si necesitas información específica sobre precios, horarios o reservas, no dudes en preguntar. También puedes pedir hablar con un 'asesor'.";
  }

  private supportAgentResponse(message: string): string {
    return (
      '🛠️ [Soporte SaaS] He recibido tu solicitud de soporte. Un ingeniero revisará tu caso pronto. ID de Ticket: #' +
      Math.floor(Math.random() * 10000)
    );
  }
}
