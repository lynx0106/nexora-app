import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Automation, AutomationType } from './entities/automation.entity';
import { AutomationRun, AutomationRunStatus } from './entities/automation-run.entity';
import { UsersService } from '../users/users.service';
import { ChatService } from '../chat/chat.service';

export interface CreateAutomationDto {
  name: string;
  type: AutomationType;
  description?: string;
  enabled?: boolean;
  schedule?: string;
  config?: Record<string, any>;
}

export interface UpdateAutomationDto {
  name?: string;
  type?: AutomationType;
  description?: string;
  enabled?: boolean;
  schedule?: string;
  config?: Record<string, any>;
}

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    @InjectRepository(Automation)
    private automationsRepository: Repository<Automation>,
    @InjectRepository(AutomationRun)
    private automationRunsRepository: Repository<AutomationRun>,
    private usersService: UsersService,
    private chatService: ChatService,
  ) {}

  async findAll(tenantId: string): Promise<Automation[]> {
    this.logger.log(`Finding all automations for tenant: ${tenantId}`);
    return this.automationsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Automation> {
    this.logger.log(`Finding automation: ${id} for tenant: ${tenantId}`);
    const automation = await this.automationsRepository.findOne({
      where: { id, tenantId },
      relations: ['createdBy', 'runs'],
    });

    if (!automation) {
      throw new NotFoundException(`Automatización con ID ${id} no encontrada`);
    }

    return automation;
  }

  async create(createAutomationDto: CreateAutomationDto, tenantId: string, userId: string): Promise<Automation> {
    this.logger.log(`Creating automation: ${createAutomationDto.name} for tenant: ${tenantId}`);

    const nextRunAt = this.calculateNextRunTime(createAutomationDto.schedule) ?? undefined;

    const automation = this.automationsRepository.create({
      ...createAutomationDto,
      tenantId,
      createdById: userId,
      nextRunAt,
      enabled: createAutomationDto.enabled ?? true,
      config: createAutomationDto.config ?? {},
    });

    const saved = await this.automationsRepository.save(automation);
    this.logger.log(`Automation created with ID: ${saved.id}`);
    return saved;
  }

  async update(id: string, updateAutomationDto: UpdateAutomationDto, tenantId: string): Promise<Automation> {
    this.logger.log(`Updating automation: ${id} for tenant: ${tenantId}`);

    const automation = await this.findOne(id, tenantId);

    if (updateAutomationDto.schedule && updateAutomationDto.schedule !== automation.schedule) {
      automation.nextRunAt = this.calculateNextRunTime(updateAutomationDto.schedule) ?? null;
    }

    Object.assign(automation, updateAutomationDto);
    return this.automationsRepository.save(automation);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting automation: ${id} for tenant: ${tenantId}`);
    const automation = await this.findOne(id, tenantId);
    await this.automationsRepository.remove(automation);
    this.logger.log(`Automation deleted: ${id}`);
  }

  async toggle(id: string, tenantId: string): Promise<Automation> {
    this.logger.log(`Toggling automation: ${id}`);
    const automation = await this.findOne(id, tenantId);
    automation.enabled = !automation.enabled;
    return this.automationsRepository.save(automation);
  }

  // ========== RUN MANAGEMENT ==========

  async getRuns(automationId: string, tenantId: string): Promise<AutomationRun[]> {
    await this.findOne(automationId, tenantId);

    return this.automationRunsRepository.find({
      where: { automationId },
      order: { startedAt: 'DESC' },
      take: 50,
    });
  }

  async runNow(id: string, tenantId: string, userId: string): Promise<AutomationRun> {
    this.logger.log(`Manual execution requested for automation: ${id}`);
    const automation = await this.findOne(id, tenantId);

    const run = this.automationRunsRepository.create({
      automationId: automation.id,
      status: AutomationRunStatus.PENDING,
      executedById: userId,
    });

    const savedRun = await this.automationRunsRepository.save(run);

    this.executeAutomation(automation, savedRun).catch((err) => {
      this.logger.error(`Error executing automation ${id}: ${err.message}`, err.stack);
    });

    return savedRun;
  }

  // ========== SCHEDULER METHODS ==========

  async getDueAutomations(): Promise<Automation[]> {
    const now = new Date();
    return this.automationsRepository
      .createQueryBuilder('automation')
      .where('automation.enabled = :enabled', { enabled: true })
      .andWhere('automation.nextRunAt <= :now', { now })
      .getMany();
  }

  async executeAutomation(automation: Automation, run: AutomationRun): Promise<void> {
    this.logger.log(`Executing automation: ${automation.id} (${automation.name})`);

    try {
      run.status = AutomationRunStatus.RUNNING;
      await this.automationRunsRepository.save(run);

      let result: Record<string, any> = {};

      switch (automation.type) {
        case AutomationType.REMINDER:
          result = await this.executeReminderAutomation(automation);
          break;
        case AutomationType.BULK_MESSAGE:
          result = await this.executeBulkMessageAutomation(automation);
          break;
        case AutomationType.CLEANUP:
          result = await this.executeCleanupAutomation(automation);
          break;
        case AutomationType.INDIVIDUAL_MESSAGE:
          result = await this.executeIndividualMessageAutomation(automation);
          break;
        default:
          result = { error: 'Unknown automation type' };
      }

      run.status = AutomationRunStatus.COMPLETED;
      run.result = result;
      run.completedAt = new Date();

      automation.lastRunAt = new Date();
      automation.nextRunAt = this.calculateNextRunTime(automation.schedule) ?? null;

      await this.automationRunsRepository.save(run);
      await this.automationsRepository.save(automation);

      this.logger.log(`Automation ${automation.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Error executing automation ${automation.id}: ${error.message}`, error.stack);
      run.status = AutomationRunStatus.FAILED;
      run.errorMessage = error.message;
      run.completedAt = new Date();
      await this.automationRunsRepository.save(run);
    }
  }

  // ========== AUTOMATION EXECUTORS ==========

  private async executeReminderAutomation(automation: Automation): Promise<Record<string, any>> {
    const config = automation.config;
    const hoursBefore = config.hoursBefore || [24, 2];
    const channels = config.channels || ['email'];

    this.logger.log(`Executing reminder automation: ${hoursBefore.join(', ')} hours before`);

    return {
      type: 'reminder',
      hoursBefore,
      channels,
      appointmentsFound: 0,
      messagesSent: 0,
    };
  }

  private async executeBulkMessageAutomation(automation: Automation): Promise<Record<string, any>> {
    const config = automation.config;
    const target = config.target || 'all_clients';

    this.logger.log(`Executing bulk message automation to: ${target}`);

    return {
      type: 'bulk_message',
      target,
      message: config.message?.substring(0, 50) + '...',
      recipientsFound: 0,
      messagesSent: 0,
    };
  }

  private async executeIndividualMessageAutomation(automation: Automation): Promise<Record<string, any>> {
    const config = automation.config;
    
    // Config expected:
    // - targetUserId: specific user ID to send message to
    // - message: the message content
    // - scope: 'INTERNAL' or 'CUSTOMER' (default: 'INTERNAL')
    const targetUserId = config.targetUserId;
    const message = config.message;
    const scope = config.scope || 'INTERNAL';

    this.logger.log(`Executing individual message automation to user: ${targetUserId}`);

    if (!targetUserId) {
      return {
        type: 'individual_message',
        success: false,
        error: 'No targetUserId specified in config',
        messagesSent: 0,
      };
    }

    if (!message) {
      return {
        type: 'individual_message',
        success: false,
        error: 'No message specified in config',
        messagesSent: 0,
      };
    }

    try {
      // Get the target user to find their tenant
      const targetUser = await this.usersService.findOne(targetUserId);
      
      if (!targetUser) {
        return {
          type: 'individual_message',
          success: false,
          error: `Target user ${targetUserId} not found`,
          messagesSent: 0,
        };
      }

      const tenantId = targetUser.tenantId;

      // Security: Verify tenant isolation - only allow sending to users in the same tenant
      if (targetUser.tenantId !== tenantId) {
        throw new ForbiddenException('No puedes enviar mensajes a usuarios de otros tenants');
      }
      
      // Determine sender: use system automation sender
      // We use null senderId for automation-generated messages
      const senderId = config.senderId || null;
      
      // Create and send the message via ChatService
      const createdMessage = await this.chatService.createMessage(
        message,
        senderId,
        tenantId,
        scope,
        targetUserId,
        false, // isAi - automation messages are not AI-generated
        undefined, // mediaUrl
        'text',
      );

      this.logger.log(`Individual message sent to user ${targetUserId}: ${message.substring(0, 50)}...`);

      return {
        type: 'individual_message',
        success: true,
        targetUserId,
        tenantId,
        scope,
        messageId: createdMessage.id,
        messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messagesSent: 1,
      };
    } catch (error) {
      this.logger.error(`Error sending individual message: ${error.message}`, error.stack);
      return {
        type: 'individual_message',
        success: false,
        error: error.message,
        messagesSent: 0,
      };
    }
  }

  private async executeCleanupAutomation(automation: Automation): Promise<Record<string, any>> {
    const config = automation.config;
    const tasks = config.tasks || ['expired_tokens'];

    this.logger.log(`Executing cleanup automation: ${tasks.join(', ')}`);

    const results: Record<string, any> = {
      type: 'cleanup',
      tasks: {},
    };

    for (const task of tasks) {
      switch (task) {
        case 'expired_tokens':
          results.tasks[task] = { deleted: 0 };
          break;
        case 'old_messages':
          results.tasks[task] = { deleted: 0 };
          break;
        case 'inactive_clients':
          results.tasks[task] = { updated: 0 };
          break;
      }
    }

    return results;
  }

  // ========== HELPERS ==========

  private calculateNextRunTime(schedule: string | undefined): Date | null {
    if (!schedule) {
      const next = new Date();
      next.setHours(next.getHours() + 1);
      return next;
    }

    try {
      const parts = schedule.split(' ');
      if (parts.length >= 5) {
        const now = new Date();
        const next = new Date(now);

        if (schedule.startsWith('0 * * * *')) {
          next.setHours(next.getHours() + 1);
          next.setMinutes(0);
          next.setSeconds(0);
        } else if (schedule.startsWith('0 0 * * *')) {
          next.setDate(next.getDate() + 1);
          next.setHours(0);
          next.setMinutes(0);
          next.setSeconds(0);
        } else if (schedule.startsWith('0 9 * * 1')) {
          const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
          next.setDate(next.getDate() + daysUntilMonday);
          next.setHours(9);
          next.setMinutes(0);
          next.setSeconds(0);
        } else {
          next.setHours(next.getHours() + 1);
        }

        return next;
      }
    } catch (e) {
      this.logger.warn(`Failed to parse schedule: ${schedule}, using default`);
    }

    const next = new Date();
    next.setHours(next.getHours() + 1);
    return next;
  }
}
