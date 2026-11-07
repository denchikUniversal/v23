import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.interface';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express';
import { isDev } from '../utils/is-dev.utils';

@Injectable()
export class AuthService {

  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prisma: PrismaService, 
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL');
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL');
    this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  async register(res: Response, dto: RegisterRequest) {
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

    return this.auth(res, user.id);
  }

  async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true }
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const isPasswordValid = await verify(user.password, password);

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid data');
    }

    return this.auth(res, user.id);
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

   private auth(res: Response, userId: string) {
    const { accesToken, refreshToken } = this.generateAccesToken(userId);

    const days7ttl = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

    this.setCookie(res, refreshToken, days7ttl);
    return { accesToken };
  }

  private setCookie(res: Response, token: string, ttl: Date) {
   const isDevelopment = isDev(this.configService);
   console.log('isDevelopment', isDevelopment);

    res.cookie('refresh_token', token, {
      expires: ttl,
      httpOnly: true,
      secure: !isDevelopment, // false на localhost (чтобы работал HTTP)
      // На localhost 'none' требует HTTPS. Для разработки ставим 'lax'
      sameSite: isDevelopment ? 'lax' : 'none', 
      ...(isDevelopment ? {} : { domain: this.COOKIE_DOMAIN }), 
    });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);
    if (payload) {
      const user = await this.prisma.user.findUnique({
        where: {id: payload.id},
        select: {id: true}
      })

      if (!user) {
        throw new NotFoundException();
      }

      return this.auth(res, user.id);
    }
  }

  async logout(res: Response) {
    this.setCookie(res, 'refreshToken', new Date(0));
  }

  async validate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {id},
    })

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

   async getAllUsers() {
    return this.prisma.user.findMany();
  }
}
