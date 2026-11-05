import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { hash } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.interface';

@Injectable()
export class AuthService {

  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;

  constructor(
    private readonly prisma: PrismaService, 
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL');
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL');
  }

  async register(dto: RegisterRequest) {
    const { name, email, password } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: await hash(password)
      }
    });

    return this.generateAccesToken(user.id);
  }

  private generateAccesToken(userId: string) {
    const payload: JwtPayload = { id: userId };

    const accesToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL as JwtSignOptions['expiresIn']
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL as JwtSignOptions['expiresIn']
    });

    return { accesToken, refreshToken };
  }

   async getAllUsers() {
    return this.prisma.user.findMany();
  }
}
