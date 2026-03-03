import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AppointmentsModule, InvitationsModule, AuthModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
