import { ConfigService } from "@nestjs/config";

export const isDev = (configService: ConfigService): boolean => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  return nodeEnv === 'development';
}