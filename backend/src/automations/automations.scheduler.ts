import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationsService } from './automations.service';
import {
  AutomationRun,
  AutomationRunStatus,
} from './entities/automation-run.entity';

@Injectable()
export class AutomationsScheduler {
  private readonly logger = new Logger(AutomationsScheduler.name);
  private isProcessing = false;

  constructor(
    private readonly automationsService: AutomationsService,
    @InjectRepository(AutomationRun)
    private automationRunsRepository: Repository<AutomationRun>,
  ) {}

  // Run every minute to check for due automations
  @Cron(process.env.AUTOMATION_SCHEDULE_INTERVAL || '* * * * *')
  async handleCron() {
    if (this.isProcessing) {
      this.logger.debug(
        'Previous automation run still in progress, skipping...',
      );
      return;
    }

    this.isProcessing = true;

    try {
      this.logger.debug('Checking for due automations...');
      const dueAutomations = await this.automationsService.getDueAutomations();

      if (dueAutomations.length > 0) {
        this.logger.log(
          `Found ${dueAutomations.length} due automations to execute`,
        );

        for (const automation of dueAutomations) {
          // Create a run record in the database for scheduled execution
          const run = this.automationRunsRepository.create({
            automationId: automation.id,
            status: AutomationRunStatus.PENDING,
            executedById: 'system',
          });

          try {
            const savedRun = await this.automationRunsRepository.save(run);
            await this.automationsService.executeAutomation(
              automation,
              savedRun,
            );
          } catch (error) {
            this.logger.error(
              `Error executing automation ${automation.id}: ${error.message}`,
              error.stack,
            );
            // Update run status to failed
            run.status = AutomationRunStatus.FAILED;
            run.errorMessage = error.message;
            run.completedAt = new Date();
            await this.automationRunsRepository.save(run).catch(() => {});
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in automation scheduler: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }
}
