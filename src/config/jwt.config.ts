import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.secret'),
  signOptions: {
    expiresIn: configService.get<string>('jwt.expiresIn'),
  },
});
