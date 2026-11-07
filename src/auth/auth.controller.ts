import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user',
    description: 'Registers a new user with the provided name, email, and password.',
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({passthrough: true}) res: Response, 
    @Body() dto: RegisterRequest
  ) {
    return this.authService.register(res, dto);
  }

  @ApiOperation({
    summary: 'Login a user',
    description: 'Logs in a user with the provided email and password.',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({passthrough: true}) res: Response, 
    @Body() dto: LoginRequest
  ) {
    return this.authService.login(res, dto);
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refreshes the access token using the refresh token stored in cookies.',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({passthrough: true}) res: Response, 
  ) {
    return this.authService.refresh(req, res);
  }

  @ApiOperation({
    summary: 'Logout a user',
    description: 'Logs out a user by clearing the refresh token cookie.',
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({passthrough: true}) res: Response) {
    return this.authService.logout(res);
  }

  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of all registered users.',
  })
  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}
