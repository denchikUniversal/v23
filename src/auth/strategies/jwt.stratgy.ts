import {PassportStrategy} from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt.interface";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {
    const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      // Провайдер вместо статического secretOrKey
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        if (!jwtSecret) {
          return done(new Error('JWT_SECRET is not defined'), undefined);
        }
        done(null, jwtSecret);
      },
    });
  }

  async validate(payload: JwtPayload) {
    return this.authService.validate(payload.id);
  }
}