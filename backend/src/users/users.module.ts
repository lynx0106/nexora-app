import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersInitController } from './users-init.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => TenantsModule)],
  controllers: [UsersController, UsersInitController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
