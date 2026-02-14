import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new UnauthorizedException('El correo ya está en uso');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      tenantId: data.tenantId,
      role: data.role ?? 'user',
    });
    const { passwordHash: _, ...safeUser } = user;
    void _;
    return safeUser;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    console.log(
      `[AuthDebug] User found. ID: ${user.id}. Hash starts with: ${user.passwordHash?.substring(0, 10)}`,
    );

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const { passwordHash: _, ...safeUser } = user;
    void _;
    return safeUser;
  }

  async login(data: LoginDto) {
    const user = await this.validateUser(data.email, data.password);
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, user };
  }
}
