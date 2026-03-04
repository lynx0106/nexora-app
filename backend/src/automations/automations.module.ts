import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { AutomationsScheduler } from './automations.scheduler';
import { Automation } from './entities/automation.entity';
import { AutomationRun } from './entities/automation-run.entity';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Automation, AutomationRun]),
    UsersModule,
    ChatModule,
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationsScheduler],
  exports: [AutomationsService],
})
export class AutomationsModule {}
