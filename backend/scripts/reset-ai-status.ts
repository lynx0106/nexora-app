
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Message } from '../src/chat/entities/message.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);
  const messageRepo = dataSource.getRepository(Message);

  const email = 'cliente@abastos.com';
  const user = await userRepo.findOne({ where: { email } });

  if (!user) {
    console.log(`User ${email} not found.`);
    process.exit(1);
  }

  console.log(`Resetting AI status for ${user.firstName} (${user.id})...`);
  user.isAiChatActive = true;
  await userRepo.save(user);

  console.log('Clearing chat history for a clean test...');
  await messageRepo.delete({ senderId: user.id });
  await messageRepo.delete({ targetUserId: user.id });

  console.log('✅ User reset complete.');
  await app.close();
}

run();
