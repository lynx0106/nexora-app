import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'clince06@gmail.com';
  console.log(`Searching for user: ${email}`);

  const user = await usersService.findByEmail(email);
  if (user) {
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Reset password to '123456'
    const bcrypt = require('bcrypt');
    const newHash = await bcrypt.hash('123456', 10);
    user.passwordHash = newHash;
    await usersService.createUser(user); // save (createUser uses save which works for update if id exists)

    console.log('PASSWORD RESET TO: 123456');
  } else {
    console.log('User NOT found in database.');
  }

  await app.close();
}

bootstrap();
